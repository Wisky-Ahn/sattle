import SwiftUI

@main
struct DevSetupApp: App {
    @StateObject private var installer = InstallerViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(installer)
                .frame(width: 520, height: 620)
                .background(Color.bgPrimary)
                .task { loadConfig() }
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
    }

    /// 앱 실행 디렉토리에서 devsetup-config.json 읽기
    private func loadConfig() {
        let bundlePath = Bundle.main.bundlePath
        let appDir = (bundlePath as NSString).deletingLastPathComponent
        let configPath = (appDir as NSString).appendingPathComponent("devsetup-config.json")

        guard FileManager.default.fileExists(atPath: configPath),
              let data = try? Data(contentsOf: URL(fileURLWithPath: configPath)),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return }

        if let apiURL = json["api_base_url"] as? String {
            installer.apiBaseURL = apiURL
        }
        if let installId = json["install_id"] as? String {
            installer.installId = installId
        }
        if let apiKey = json["api_key"] as? String {
            installer.apiKey = apiKey
        }
        if let title = json["title"] as? String {
            installer.spec.title = title
        }
        if let framework = json["framework"] as? String {
            installer.spec.framework = framework
        }
        if let specContent = json["spec_content"] as? [String: Any] {
            if let summary = specContent["summary"] as? String {
                installer.spec.summary = summary
            }
            if let rawInput = specContent["raw_input"] as? String {
                installer.spec.rawInput = rawInput
            }
            if let toolsData = try? JSONSerialization.data(withJSONObject: specContent["tools"] ?? []),
               let tools = try? JSONDecoder().decode([SetupTool].self, from: toolsData) {
                installer.spec.tools = tools
            }
            if let cmds = specContent["verification_commands"] as? [String] {
                installer.spec.verificationCommands = cmds
            }
        }
    }
}
