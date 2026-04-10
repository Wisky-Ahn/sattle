import Foundation

// MARK: - Install Step Model
struct InstallStep: Identifiable {
    let id: Int
    let name: String
    var status: StepStatus = .pending
    var message: String?

    enum StepStatus: String {
        case pending
        case running
        case done
        case error
    }
}

// MARK: - App State
enum AppPhase {
    case welcome       // 시작 + 비밀번호 입력
    case installing    // 설치 진행 중
    case success       // 완료
    case failure       // 실패
}

// MARK: - 서버에서 받은 명세 정보
struct SpecInfo: Codable {
    var title: String = ""
    var framework: String = ""
    var summary: String = ""
    var tools: [SetupTool] = []
    var verificationCommands: [String] = []
    var rawInput: String = ""
}

struct SetupTool: Codable {
    let name: String
    let version: String?
    let category: String
    let installCommand: String?

    enum CodingKeys: String, CodingKey {
        case name, version, category
        case installCommand = "install_command"
    }
}

// MARK: - API 응답
struct SpecResponse: Codable {
    let id: String
    let title: String
    let framework: String
    let specContent: SpecContentResponse

    enum CodingKeys: String, CodingKey {
        case id, title, framework
        case specContent = "spec_content"
    }
}

struct SpecContentResponse: Codable {
    let summary: String
    let tools: [SetupTool]
    let verificationCommands: [String]
    let rawInput: String

    enum CodingKeys: String, CodingKey {
        case summary, tools
        case verificationCommands = "verification_commands"
        case rawInput = "raw_input"
    }
}
