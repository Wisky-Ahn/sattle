import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject var vm: InstallerViewModel
    @FocusState private var isPasswordFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 60)

            // 아이콘
            ZStack {
                Circle()
                    .fill(Color.accentBlue.opacity(0.15))
                    .frame(width: 80, height: 80)
                Image(systemName: "wrench.and.screwdriver.fill")
                    .font(.system(size: 36))
                    .foregroundColor(.accentBlue)
                    .glow(.accentGlow, radius: 12)
            }

            Spacer().frame(height: 24)

            // 타이틀
            Text("sattle")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.textPrimary)

            Spacer().frame(height: 12)

            // 설명
            Text(vm.spec.title.isEmpty
                ? "개발 환경을\n자동으로 설치합니다"
                : "\(vm.spec.title)을\n자동으로 설치합니다")
                .font(.system(size: 15))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, 40)

            Spacer().frame(height: 8)

            // 스펙 태그 (AI가 파싱한 도구 목록) — FlowLayout으로 감싸기
            if !vm.spec.tools.isEmpty {
                FlowLayout(spacing: 6) {
                    ForEach(vm.spec.tools.prefix(6), id: \.name) { tool in
                        specTag("\(tool.name)\(tool.version.map { " \($0)" } ?? "")")
                    }
                }
                .padding(.horizontal, 40)
            } else if !vm.spec.framework.isEmpty {
                HStack(spacing: 8) {
                    specTag(vm.spec.framework)
                }
            }

            Spacer().frame(height: 40)

            // 비밀번호 입력
            VStack(alignment: .leading, spacing: 8) {
                Text("macOS 비밀번호")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.textSecondary)

                SecureField("환경 설치에 필요합니다", text: $vm.password)
                    .textFieldStyle(.plain)
                    .font(.system(size: 15))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Color.bgCard)
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(isPasswordFocused ? Color.accentBlue : Color.clear, lineWidth: 1.5)
                    )
                    .focused($isPasswordFocused)
                    .onSubmit { vm.startInstall() }
            }
            .padding(.horizontal, 60)

            Spacer().frame(height: 32)

            // 설치 버튼
            Button(action: { vm.startInstall() }) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.system(size: 16))
                    Text("설치 시작")
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundColor(.white)
                .frame(width: 200, height: 48)
                .background(
                    vm.password.isEmpty
                        ? Color.accentBlue.opacity(0.4)
                        : Color.accentBlue
                )
                .cornerRadius(12)
                .glow(vm.password.isEmpty ? .clear : .accentGlow, radius: 10)
            }
            .buttonStyle(.plain)
            .disabled(vm.password.isEmpty)

            Spacer()
        }
    }

    private func specTag(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 12, weight: .medium))
            .foregroundColor(.accentBlue)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color.accentBlue.opacity(0.12))
            .cornerRadius(6)
    }
}
