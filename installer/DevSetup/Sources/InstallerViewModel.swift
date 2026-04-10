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

    // 설정 (빌드 시 주입 또는 런타임 설정)
    var apiBaseURL: String = ""
    var installId: String = ""

    var totalSteps: Int { steps.count }
    var completedSteps: Int { steps.filter { $0.status == .done }.count }
    var progress: Double {
        guard totalSteps > 0 else { return 0 }
        return Double(completedSteps) / Double(totalSteps)
    }

    static func defaultSteps() -> [InstallStep] {
        [
            InstallStep(id: 1, name: "명세 파싱"),
            InstallStep(id: 2, name: "환경 진단"),
            InstallStep(id: 3, name: "충돌 정리"),
            InstallStep(id: 4, name: "패키지 설치"),
            InstallStep(id: 5, name: "프로젝트 생성"),
            InstallStep(id: 6, name: "빌드 검증"),
            InstallStep(id: 7, name: "결과 보고"),
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
            // 서버 연결 실패 시 로컬 명세 사용
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

        Task {
            await runInstallation()
        }
    }

    // MARK: - 설치 로직 — OpenClaw에 위임
    private func runInstallation() async {
        let startTime = Date()

        // Step 1: sudo 검증
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

        // Step 2: 환경 진단
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

        // Step 3: 충돌 정리
        await runStep(index: 2, message: "충돌 항목 확인 중...", script: """
            # Xcode CLT 확인
            if ! xcode-select -p &>/dev/null; then
                echo "Xcode CLT 필요 - 설치 중..."
                xcode-select --install 2>/dev/null || true
            fi
            # brew 확인
            if ! command -v brew &>/dev/null; then
                echo "Homebrew 설치 중..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null 2>&1 || true
            fi
            echo "기본 도구 확인 완료"
        """)
        guard phase == .installing else { return }

        // Step 4: 각 도구를 실제로 설치
        let toolsToInstall = spec.tools.filter { $0.installCommand != nil && !$0.installCommand!.isEmpty }
        let installableTools = toolsToInstall.isEmpty ? generateInstallCommands() : toolsToInstall

        await runStep(index: 3, message: "도구 설치 중 (\(installableTools.count)개)...", script: buildInstallScript(tools: installableTools))
        guard phase == .installing else { return }

        // Step 5: 프로젝트 환경 구성 (환경변수 + PATH 업데이트)
        await runStep(index: 4, message: "환경변수 및 PATH 설정 중...", script: """
            # 새로 설치된 도구들의 PATH 확인
            echo "=== 설치 후 PATH 확인 ==="
            export PATH="$HOME/.cargo/bin:$HOME/.rustup/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
            export SDKMAN_DIR="$HOME/.sdkman"
            [ -s "$SDKMAN_DIR/bin/sdkman-init.sh" ] && . "$SDKMAN_DIR/bin/sdkman-init.sh"
            eval "$(pyenv init -)" 2>/dev/null || true

            echo "PATH: $PATH"
            echo "환경 구성 완료"
        """)
        guard phase == .installing else { return }

        // Step 6: 빌드 검증
        let verifyCommands = spec.verificationCommands.isEmpty
            ? ["echo '검증 명령 없음'"]
            : spec.verificationCommands
        let verifyScript = verifyCommands.map { "echo '$ \($0)' && (\($0) 2>&1 || echo '검증 실패: \($0)')" }.joined(separator: "\n")

        await runStep(index: 5, message: "빌드 검증 중...", script: """
            export PATH="$HOME/.cargo/bin:$HOME/.rustup/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
            export SDKMAN_DIR="$HOME/.sdkman"
            [ -s "$SDKMAN_DIR/bin/sdkman-init.sh" ] && . "$SDKMAN_DIR/bin/sdkman-init.sh"
            eval "$(pyenv init -)" 2>/dev/null || true

            \(verifyScript)
        """)
        guard phase == .installing else { return }

        // Step 7: 결과 보고
        steps[6].status = .running
        steps[6].message = "결과 정리 중..."
        currentStepIndex = 6

        // 상태 보고 (서버 연동 시)
        await reportStatus(step: 7, status: "success", message: "설치 완료")

        steps[6].status = .done

        let elapsed = Date().timeIntervalSince(startTime)
        buildTime = String(format: "%.1f초", elapsed)
        phase = .success
    }

    // MARK: - 설치 스크립트 빌드
    private func buildInstallScript(tools: [SetupTool]) -> String {
        var lines: [String] = [
            "# PATH 확장",
            "export PATH=\"$HOME/.cargo/bin:$HOME/.rustup/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH\"",
            "export NVM_DIR=\"$HOME/.nvm\"",
            "[ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"",
            "export SDKMAN_DIR=\"$HOME/.sdkman\"",
            "[ -s \"$SDKMAN_DIR/bin/sdkman-init.sh\" ] && . \"$SDKMAN_DIR/bin/sdkman-init.sh\"",
            "eval \"$(pyenv init -)\" 2>/dev/null || true",
            "",
        ]

        for tool in tools {
            guard let cmd = tool.installCommand, !cmd.isEmpty else { continue }
            lines.append("echo '▶ \(tool.name) 설치 중...'")
            lines.append("\(cmd) 2>&1 | tail -5 || echo '⚠ \(tool.name) 설치 실패'")
            lines.append("")
        }

        lines.append("echo '✅ 모든 도구 설치 시도 완료'")
        return lines.joined(separator: "\n")
    }

    // MARK: - tools에 install_command가 없을 때 기본 명령 생성
    private func generateInstallCommands() -> [SetupTool] {
        return spec.tools.map { tool in
            if tool.installCommand != nil && !tool.installCommand!.isEmpty {
                return tool
            }
            let cmd = defaultInstallCommand(for: tool)
            return SetupTool(name: tool.name, version: tool.version, category: tool.category, installCommand: cmd)
        }.filter { $0.installCommand != nil && !$0.installCommand!.isEmpty }
    }

    // MARK: - 도구별 기본 설치 명령
    private func defaultInstallCommand(for tool: SetupTool) -> String? {
        let name = tool.name.lowercased()
        switch name {
        case "rustup", "rust", "cargo":
            return "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable"
        case "brew", "homebrew":
            return "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\" </dev/null"
        case "node", "node.js", "nodejs":
            return "command -v nvm || curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash; export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; nvm install \(tool.version ?? "20")"
        case "python", "python3":
            return "brew install python@\(tool.version ?? "3.12") 2>/dev/null || pyenv install -s \(tool.version ?? "3.12")"
        case "java", "openjdk":
            return "brew install openjdk@\(tool.version ?? "17")"
        case "go", "golang":
            return "brew install go"
        case "gradle":
            return "brew install gradle"
        case "maven":
            return "brew install maven"
        case "docker":
            return "brew install --cask docker"
        case "git":
            return "brew install git"
        case "postgresql", "postgres":
            return "brew install postgresql"
        case "mysql":
            return "brew install mysql"
        case "redis":
            return "brew install redis"
        default:
            // 프레임워크/패키지는 언어별 패키지 매니저 필요
            if tool.category == "package" || tool.category == "framework" {
                return nil // 빌드 도구가 설치된 후 별도로 처리
            }
            // 기타는 brew 시도
            return "brew install \(name) 2>/dev/null || echo '\(name) brew에서 찾을 수 없음'"
        }
    }

    // MARK: - tools에서 명세 텍스트 생성
    private func generateSpecFromTools() -> String {
        var lines = ["# 환경 명세 — \(spec.title)", ""]
        for tool in spec.tools {
            lines.append("- \(tool.name)\(tool.version.map { " \($0)" } ?? "")")
        }
        if !spec.verificationCommands.isEmpty {
            lines.append("")
            lines.append("## 검증 명령")
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
}
