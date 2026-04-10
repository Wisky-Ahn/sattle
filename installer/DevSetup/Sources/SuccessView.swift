import SwiftUI

struct SuccessView: View {
    @EnvironmentObject var vm: InstallerViewModel
    @State private var dotsVisible = true
    @State private var checkVisible = false
    @State private var contentVisible = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 60)

            // 도트 → 체크마크 전환 애니메이션
            ZStack {
                // 완료 도트
                if dotsVisible {
                    HStack(spacing: 10) {
                        ForEach(0..<vm.totalSteps, id: \.self) { _ in
                            Circle()
                                .fill(Color.accentBlue)
                                .frame(width: 12, height: 12)
                                .glow(.accentGlow, radius: 6)
                        }
                    }
                    .transition(.scale.combined(with: .opacity))
                }

                // 체크마크
                if checkVisible {
                    ZStack {
                        Circle()
                            .fill(Color.successGreen.opacity(0.15))
                            .frame(width: 90, height: 90)
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 56))
                            .foregroundColor(.successGreen)
                            .glow(.successGreen, radius: 16)
                    }
                    .transition(.scale(scale: 0.3).combined(with: .opacity))
                }
            }
            .frame(height: 100)

            if contentVisible {
                Spacer().frame(height: 20)

                Text("환경 세팅이 완료되었습니다!")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.textPrimary)

                Spacer().frame(height: 20)

                // 결과 카드
                VStack(spacing: 12) {
                    if !vm.spec.framework.isEmpty {
                        resultRow("프레임워크", vm.spec.framework)
                    }
                    if !vm.spec.summary.isEmpty {
                        resultRow("요약", vm.spec.summary)
                    }
                    resultRow("설치 도구", "\(vm.spec.tools.count)개")
                    if !vm.buildTime.isEmpty {
                        resultRow("소요 시간", vm.buildTime)
                    }
                }
                .padding(20)
                .background(Color.bgCard)
                .cornerRadius(12)
                .padding(.horizontal, 60)

                Spacer().frame(height: 32)

                // 닫기 버튼
                Button(action: {
                    NSApplication.shared.terminate(nil)
                }) {
                    Text("닫기")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.textPrimary)
                        .frame(width: 140, height: 42)
                        .background(Color.bgCard)
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.textSecondary.opacity(0.3), lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
            }

            Spacer()
        }
        .onAppear { runAnimation() }
    }

    private func runAnimation() {
        // 도트 표시 → 모여서 체크마크로
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                dotsVisible = false
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.3) {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                checkVisible = true
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
            withAnimation(.easeOut(duration: 0.4)) {
                contentVisible = true
            }
        }
    }

    private func resultRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.textSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.textPrimary)
        }
    }
}
