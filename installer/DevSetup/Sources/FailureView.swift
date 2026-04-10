import SwiftUI

struct FailureView: View {
    @EnvironmentObject var vm: InstallerViewModel
    @State private var appear = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 60)

            // 도트 (실패 지점까지)
            HStack(spacing: 10) {
                ForEach(0..<vm.totalSteps, id: \.self) { index in
                    Circle()
                        .fill(index < vm.completedSteps ? Color.accentBlue : Color.dotInactive)
                        .frame(width: index == vm.currentStepIndex ? 14 : 10,
                               height: index == vm.currentStepIndex ? 14 : 10)
                        .overlay(
                            index == vm.currentStepIndex
                                ? Circle().fill(Color.errorRed).frame(width: 14, height: 14)
                                    .glow(.errorRed, radius: 6)
                                : nil
                        )
                }
            }

            Spacer().frame(height: 24)

            // X 아이콘
            ZStack {
                Circle()
                    .fill(Color.errorRed.opacity(0.15))
                    .frame(width: 80, height: 80)
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.errorRed)
                    .glow(.errorRed, radius: 12)
            }
            .scaleEffect(appear ? 1.0 : 0.5)
            .opacity(appear ? 1.0 : 0.0)

            Spacer().frame(height: 20)

            Text("설치에 실패했습니다")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.textPrimary)
                .opacity(appear ? 1 : 0)

            Spacer().frame(height: 12)

            // 에러 메시지
            Text(vm.errorMessage)
                .font(.system(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 60)
                .opacity(appear ? 1 : 0)

            // 실패한 단계 표시
            if let failedStep = vm.steps.first(where: { $0.status == .error }) {
                Text("실패 단계: [\(failedStep.id)/\(vm.totalSteps)] \(failedStep.name)")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.errorRed.opacity(0.8))
                    .padding(.top, 8)
                    .opacity(appear ? 1 : 0)
            }

            Spacer().frame(height: 32)

            // 버튼들
            HStack(spacing: 16) {
                // 재시도
                Button(action: { vm.retry() }) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.clockwise")
                        Text("재시도")
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 130, height: 42)
                    .background(Color.accentBlue)
                    .cornerRadius(10)
                }
                .buttonStyle(.plain)

                // 로그 보기
                Button(action: { withAnimation { vm.showLog.toggle() } }) {
                    HStack(spacing: 6) {
                        Image(systemName: "doc.text")
                        Text("로그 보기")
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.textPrimary)
                    .frame(width: 130, height: 42)
                    .background(Color.bgCard)
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.textSecondary.opacity(0.3), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
            .opacity(appear ? 1 : 0)

            if vm.showLog {
                ScrollView {
                    Text(vm.logOutput)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                }
                .frame(height: 120)
                .background(Color.bgCard)
                .cornerRadius(8)
                .padding(.horizontal, 40)
                .padding(.top, 16)
            }

            Spacer()
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                appear = true
            }
        }
    }
}
