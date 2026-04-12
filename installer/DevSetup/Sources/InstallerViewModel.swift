import Foundation
import SwiftUI

@MainActor
class InstallerViewModel: ObservableObject {
    @Published var phase: AppPhase = .welcome
    @Published var password: String = ""
    @Published var steps: [InstallStep] = InstallerViewModel.defaultSteps()
    @Published var currentStepIndex: Int = 0
    @Published var spec: SpecInfo = SpecInfo()
    @Published var errorMessage: String = ""
    @Published var buildTime: String = ""
    @Published var showLog: Bool = false
    @Published var logOutput: String = ""
    @Published var specId: String? = nil
    @Published var verifyWarnings: [String] = []

    var apiBaseURL: String = ""
    var installId: String = ""
    var apiKey: String = ""

    var totalSteps: Int { steps.count }
    var completedSteps: Int { steps.filter { $0.status == .done }.count }
    var progress: Double {
        guard totalSteps > 0 else { return 0 }
        return Double(completedSteps) / Double(totalSteps)
    }

    static func defaultSteps() -> [InstallStep] {
        [
            InstallStep(id: 1, name: "권한 확인"),
            InstallStep(id: 2, name: "환경 진단"),
            InstallStep(id: 3, name: "AI 에이전트 준비"),
            InstallStep(id: 4, name: "환경 세팅 (AI)"),
            InstallStep(id: 5, name: "정리"),
        ]
    }

    // MARK: - 서버에서 명세 가져오기
    func fetchSpec(id: String) async {
        guard let url = URL(string: "\(apiBaseURL)/api/specs/\(id)") else { return }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoder = JSONDecoder()
            let response = try decoder.decode(SpecResponse.self, from: data)
            spec = SpecInfo(
                title: response.title,
                framework: response.framework,
                summary: response.specContent.summary,
                tools: response.specContent.tools,
                verificationCommands: response.specContent.verificationCommands,
                rawInput: response.specContent.rawInput
            )
            specId = id
        } catch {
            appendLog("서버 연결 실패: \(error.localizedDescription). 로컬 명세를 사용합니다.")
            loadLocalSpec()
        }
    }

    // MARK: - 로컬 명세 파일 읽기
    private func loadLocalSpec() {
        let bundlePath = Bundle.main.bundlePath
        let dir = (bundlePath as NSString).deletingLastPathComponent
        let fm = FileManager.default

        guard let files = try? fm.contentsOfDirectory(atPath: dir),
              let mdFile = files.first(where: { $0.hasSuffix(".md") && !$0.hasPrefix("README") })
        else { return }

        let fullPath = (dir as NSString).appendingPathComponent(mdFile)
        if let content = try? String(contentsOfFile: fullPath, encoding: .utf8) {
            spec.rawInput = content
            spec.title = mdFile.replacingOccurrences(of: ".md", with: "")
        }
    }

    // MARK: - 설치 시작
    func startInstall() {
        guard !password.isEmpty else { return }
        phase = .installing
        logOutput = ""
        verifyWarnings = []

        Task {
            await runInstallation()
        }
    }

    // MARK: - 설치 로직 — OpenClaw AI 에이전트 위임
    private func runInstallation() async {
        let startTime = Date()

        // ── Step 1: sudo 검증 ──
        steps[0].status = .running
        steps[0].message = "권한 확인 중..."
        currentStepIndex = 0

        let sudoOk = await runCommand("echo '\(password)' | sudo -S -v 2>&1")
        if sudoOk.contains("Sorry") || sudoOk.contains("incorrect") {
            steps[0].status = .error
            errorMessage = "비밀번호가 올바르지 않습니다"
            phase = .failure
            return
        }
        steps[0].status = .done
        steps[0].message = nil
        await reportStatus(step: 1, status: "installing", message: "권한 확인 완료")

        // ── Step 2: 환경 진단 ──
        await runStep(index: 1, message: "기존 환경 확인 중...", script: """
            echo "=== 시스템 정보 ==="
            uname -m
            sw_vers 2>/dev/null | head -2
            echo "=== 설치된 도구 ==="
            which java python3 node brew git 2>/dev/null || true
            echo "=== PATH ==="
            echo $PATH | tr ':' '\\n' | head -10
        """)
        guard phase == .installing else { return }

        // ── Step 3: Node.js + OpenClaw 설치 ──
        steps[2].status = .running
        steps[2].message = "AI 에이전트 설치 중..."
        currentStepIndex = 2
        await reportStatus(step: 3, status: "installing", message: "AI 에이전트 준비 중...")

        // 3a: Xcode CLT 확인
        let _ = await runCommand("""
            if ! xcode-select -p &>/dev/null; then
                xcode-select --install 2>/dev/null || true
            fi
        """)

        // 3b: Homebrew 확인
        let _ = await runCommand("""
            if ! command -v brew &>/dev/null; then
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null 2>&1
            fi
        """)

        // 3c: Node.js 22+ 확인/설치 + OpenClaw 설치 (단일 쉘 세션)
        appendLog("[3/\(totalSteps)] Node.js 22 + OpenClaw 설치 중...")
        let openclawInstall = await runCommand("""
            # nvm 로드
            export NVM_DIR="$HOME/.nvm"
            if [ ! -s "$NVM_DIR/nvm.sh" ]; then
                echo "nvm 설치 중..."
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash 2>&1
            fi
            . "$NVM_DIR/nvm.sh"

            # Node 22+ 확인 및 설치
            NODE_VER=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
            if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 22 ]; then
                echo "Node 22 설치 중..."
                nvm install 22 2>&1
                nvm alias default 22 2>&1
            fi
            nvm use 22 2>&1
            echo "Node: $(node --version)"

            # OpenClaw 설치
            echo "OpenClaw 설치 중..."
            npm install -g openclaw@latest 2>&1 | tail -5
            openclaw --version 2>&1 || echo "OPENCLAW_INSTALL_FAILED"
        """)
        appendLog(openclawInstall)

        if openclawInstall.contains("OPENCLAW_INSTALL_FAILED") {
            steps[2].status = .error
            errorMessage = "OpenClaw 설치에 실패했습니다"
            phase = .failure
            return
        }

        // 3e: OpenClaw 설정 — Swift에서 직접 파일 쓰기 (heredoc 들여쓰기 문제 방지)
        let specContent = generateSpecMarkdown()
        let specPath = "/tmp/sattle-spec.md"
        try? specContent.write(toFile: specPath, atomically: true, encoding: .utf8)

        let home = NSHomeDirectory()
        let fm = FileManager.default
        try? fm.createDirectory(atPath: "\(home)/.openclaw/workspace/skills/dev-setup", withIntermediateDirectories: true)

        // openclaw.json
        let openclawConfig = """
        {"env":{"ANTHROPIC_API_KEY":"\(apiKey)"},"agents":{"defaults":{"model":{"primary":"anthropic/claude-sonnet-4-6"}}},"gateway":{"mode":"local"}}
        """
        try? openclawConfig.write(toFile: "\(home)/.openclaw/openclaw.json", atomically: true, encoding: .utf8)

        // 권한 설정
        try? fm.setAttributes([.posixPermissions: 0o700], ofItemAtPath: "\(home)/.openclaw")
        try? fm.setAttributes([.posixPermissions: 0o600], ofItemAtPath: "\(home)/.openclaw/openclaw.json")

        // AGENTS.md + SOUL.md + SKILL.md
        try? Self.agentsMd.write(toFile: "\(home)/.openclaw/workspace/AGENTS.md", atomically: true, encoding: .utf8)
        try? Self.soulMd.write(toFile: "\(home)/.openclaw/workspace/SOUL.md", atomically: true, encoding: .utf8)
        try? Self.skillMd.write(toFile: "\(home)/.openclaw/workspace/skills/dev-setup/SKILL.md", atomically: true, encoding: .utf8)

        // OpenClaw doctor
        let _ = await runCommand("""
            export NVM_DIR="$HOME/.nvm"
            . "$NVM_DIR/nvm.sh" 2>/dev/null
            nvm use 22 2>/dev/null
            openclaw doctor --fix 2>&1 || true
        """)

        steps[2].status = .done
        steps[2].message = nil

        // ── Step 4: OpenClaw 에이전트 실행 ──
        steps[3].status = .running
        steps[3].message = "AI가 환경을 세팅하고 있습니다..."
        currentStepIndex = 3
        await reportStatus(step: 4, status: "installing", message: "AI 에이전트가 환경 세팅 중...")

        // 상태 보고 API 환경변수 포함
        var envVars = ""
        if !apiBaseURL.isEmpty && !installId.isEmpty {
            envVars = """
            export SETUP_API_URL="\(apiBaseURL)"
            export INSTALL_ID="\(installId)"
            """
        }

        let agentMessage = "환경 세팅해줘. 명세 파일: \(specPath). sudo 비밀번호는 이미 캐시되어 있으니 sudo -v로 갱신만 해. 모든 설치와 검증을 완료하고, 실패하면 원인을 분석해서 자동으로 수정 후 재시도해."

        let agentOutput = await runCommand("""
            export NVM_DIR="$HOME/.nvm"
            . "$NVM_DIR/nvm.sh"
            nvm use 22 2>/dev/null
            \(envVars)

            # sudo 재캐시
            echo '\(password)' | sudo -S -v 2>&1 || true
            # sudo 세션 유지
            (while true; do sudo -n true; sleep 50; kill -0 $$ 2>/dev/null || exit; done) &
            SUDO_KEEPER=$!

            openclaw agent --local --agent main --message "\(agentMessage)" --thinking high --timeout 600 2>&1

            kill $SUDO_KEEPER 2>/dev/null || true
        """)
        appendLog("[4/\(totalSteps)] AI 에이전트 실행 결과\n\(agentOutput)")

        // 에이전트 출력에서 에러 확인
        let hasError = agentOutput.contains("FAILED") || agentOutput.contains("fatal error") || agentOutput.contains("Error:")
        let hasSuccess = agentOutput.contains("완료") || agentOutput.contains("SUCCESS") || agentOutput.contains("✅")

        if hasError && !hasSuccess {
            steps[3].status = .error
            steps[3].message = "설치 중 오류 발생"
            errorMessage = agentOutput.components(separatedBy: "\n")
                .filter { $0.contains("Error") || $0.contains("FAILED") || $0.contains("실패") }
                .joined(separator: "\n")
            if errorMessage.isEmpty { errorMessage = "알 수 없는 오류" }
            phase = .failure
            // 실패해도 정리는 진행
            await cleanupOpenClaw()
            return
        }

        steps[3].status = .done
        steps[3].message = nil

        // ── Step 5: 정리 ──
        steps[4].status = .running
        steps[4].message = "정리 중..."
        currentStepIndex = 4
        await reportStatus(step: 5, status: "installing", message: "정리 중...")

        await cleanupOpenClaw()

        // 임시 파일 정리
        try? FileManager.default.removeItem(atPath: specPath)

        steps[4].status = .done
        steps[4].message = nil

        // 완료
        await reportStatus(step: 5, status: "success", message: "설치 완료")
        let elapsed = Date().timeIntervalSince(startTime)
        buildTime = String(format: "%.1f초", elapsed)
        phase = .success
    }

    // MARK: - OpenClaw 정리
    private func cleanupOpenClaw() async {
        appendLog("[정리] OpenClaw 삭제 중...")
        let cleanupResult = await runCommand("""
            export NVM_DIR="$HOME/.nvm"
            . "$NVM_DIR/nvm.sh" 2>/dev/null
            nvm use 22 2>/dev/null
            npm uninstall -g openclaw 2>/dev/null || true
            rm -rf ~/.openclaw 2>/dev/null || true
            launchctl remove ai.openclaw.gateway 2>/dev/null || true
            rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist 2>/dev/null || true
            echo "OpenClaw 삭제 완료"
        """)
        appendLog(cleanupResult)
    }

    // MARK: - 명세 마크다운 생성
    private func generateSpecMarkdown() -> String {
        if !spec.rawInput.isEmpty { return spec.rawInput }
        var lines = ["# 환경 명세 — \(spec.title)", ""]
        if !spec.framework.isEmpty { lines.append("프레임워크: \(spec.framework)") }
        if !spec.summary.isEmpty { lines.append("\(spec.summary)") }
        lines.append("")
        for tool in spec.tools {
            lines.append("- \(tool.name)\(tool.version.map { " \($0)" } ?? "")")
        }
        if !spec.verificationCommands.isEmpty {
            lines.append("\n## 검증 명령")
            for cmd in spec.verificationCommands {
                lines.append("- \(cmd)")
            }
        }
        return lines.joined(separator: "\n")
    }

    // MARK: - 단계 실행 헬퍼
    private func runStep(index: Int, message: String, script: String) async {
        steps[index].status = .running
        steps[index].message = message
        currentStepIndex = index

        let output = await runCommand(script)
        appendLog("[\(index + 1)/\(totalSteps)] \(steps[index].name)\n\(output)")

        await reportStatus(step: index + 1, status: "installing", message: message)

        if output.contains("FAILED") || output.contains("fatal error") {
            steps[index].status = .error
            steps[index].message = output.components(separatedBy: "\n").last ?? "실패"
            errorMessage = steps[index].message ?? "알 수 없는 오류"
            phase = .failure
            return
        }

        steps[index].status = .done
        steps[index].message = nil
        try? await Task.sleep(nanoseconds: 300_000_000)
    }

    // MARK: - 서버에 상태 보고
    private func reportStatus(step: Int, status: String, message: String) async {
        guard !apiBaseURL.isEmpty, !installId.isEmpty else { return }
        guard let url = URL(string: "\(apiBaseURL)/api/install/\(installId)/status") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["step": step, "total": totalSteps, "status": status, "message": message]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        _ = try? await URLSession.shared.data(for: request)
    }

    // MARK: - 재시도
    func retry() {
        steps = InstallerViewModel.defaultSteps()
        currentStepIndex = 0
        errorMessage = ""
        logOutput = ""
        verifyWarnings = []
        phase = .installing
        Task { await runInstallation() }
    }

    // MARK: - Shell 실행
    private func runCommand(_ script: String) async -> String {
        await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let process = Process()
                let pipe = Pipe()
                process.executableURL = URL(fileURLWithPath: "/bin/zsh")
                process.arguments = ["-l", "-c", script]
                process.standardOutput = pipe
                process.standardError = pipe
                process.environment = ProcessInfo.processInfo.environment

                do {
                    try process.run()
                    process.waitUntilExit()
                    let data = pipe.fileHandleForReading.readDataToEndOfFile()
                    let output = String(data: data, encoding: .utf8) ?? ""
                    continuation.resume(returning: output.trimmingCharacters(in: .whitespacesAndNewlines))
                } catch {
                    continuation.resume(returning: "Error: \(error.localizedDescription)")
                }
            }
        }
    }

    private func appendLog(_ text: String) {
        logOutput += text + "\n\n"
    }

    // MARK: - 임베디드 에이전트 설정 파일

    static let agentsMd = """
    # AGENTS.md — 개발 환경 자동 세팅 에이전트

    당신은 개발 교육용 환경 세팅 자동화 AI 에이전트입니다. 강사가 제공한 환경 명세(.md)를 읽고, 학생의 macOS 컴퓨터에 프레임워크 개발 환경을 능동적으로 구축합니다.

    ## 핵심 원칙

    1. **능동적 실행**: 명세를 읽으면 즉시 실행한다. 매 단계마다 확인을 묻지 않는다.
    2. **진단 우선**: 설치 전에 반드시 현재 환경을 진단한다.
    3. **격리 설치**: 글로벌 환경을 건드리지 않는다. 버전 매니저(sdkman, pyenv, nvm)로 격리한다.
    4. **멱등성**: 스크립트를 여러 번 실행해도 동일한 결과를 보장한다.
    5. **자동 복구**: 설치나 검증이 실패하면 원인을 분석하고 자동으로 수정 후 재시도한다.

    ## 실행 절차

    1. **명세 읽기**: .md 명세 파일 파싱
    2. **환경 진단**: which, PATH, 버전 확인
    3. **충돌 정리**: 깨진 링크, PATH 충돌 해결
    4. **격리 설치**: 버전 매니저로 도구 설치
    5. **프로젝트 초기화**: 빌드 도구 설정, 의존성 설치
    6. **검증**: 바이너리 확인, 버전 확인, 빌드 테스트 실행
    7. **결과 보고**: 각 단계 성공/실패 요약

    ## 에러 대응

    - 설치 실패 시: 3회 재시도 → 미러 서버 시도 → 대체 방법 시도
    - 권한 부족 시: sudo 사용 (이미 캐시됨)
    - 버전 충돌 시: 버전 매니저로 격리 후 재시도
    - 검증 실패 시: 에러 메시지 분석 → 누락된 파일/설정 자동 생성 → 재검증
    - 네트워크 실패 시: 오프라인 설치 가능 여부 확인

    ## macOS 특이사항

    - Apple Silicon: /opt/homebrew/bin, Intel: /usr/local/bin
    - .zshrc가 기본 셸 설정 파일
    - brew로 설치된 런타임과 버전 매니저의 우선순위 충돌 주의

    ## 상태 보고 API

    환경변수 SETUP_API_URL과 INSTALL_ID가 있으면 각 단계마다 상태 보고:
    ```bash
    curl -s -X POST "$SETUP_API_URL/api/install/$INSTALL_ID/status" \\
      -H "Content-Type: application/json" \\
      -d '{"step": 4, "total": 5, "status": "installing", "message": "도구 설치 중"}'
    ```

    ## 진행 상태 보고 형식
    ```
    [1/7] 명세 파싱 완료 ✅
    [2/7] 환경 진단 완료 ⚠️
    [3/7] 충돌 정리 완료 ✅
    [4/7] 도구 설치 중... 🔄
    ```

    ## 자동 삭제

    환경 세팅 + 검증 완료 후 OpenClaw은 외부에서 자동 삭제됩니다. 삭제하지 마세요.
    """

    static let soulMd = """
    # SOUL.md — 에이전트 페르소나

    ## 이름
    DevSetup Agent

    ## 성격
    - 효율적이고 과묵함. 불필요한 설명 없이 바로 실행.
    - 진행 상태만 간결하게 보고.
    - 에러 발생 시에만 상세 설명.

    ## 언어
    - 한국어로 응답
    - 기술 용어는 영어 그대로 사용

    ## 톤
    - "~합니다" 체. 존댓말 사용.
    - 이모지 최소 사용 (상태 표시용만: ✅ ❌ ⚠️ 🔄)
    """

    static let skillMd = """
    ---
    name: dev_setup
    description: >
      강사의 Markdown 환경 명세를 읽고 macOS에 개발 환경을 자동으로 세팅하는 스킬.
      프레임워크 설치, 버전 관리, 의존성 설정, 빌드 검증까지 전체 과정을 자율 수행한다.
    metadata:
      openclaw:
        emoji: "🛠️"
        os: ["darwin"]
    ---

    # Dev Environment Setup Skill

    강사가 제공한 .md 명세 파일을 읽고, macOS 환경에 개발 프레임워크를 자동으로 설치하고 검증한다.
    설치 실패 시 원인을 분석하고 자동으로 수정 후 재시도한다.
    검증 실패 시 누락된 파일이나 설정을 자동 생성한 후 재검증한다.
    """
}
