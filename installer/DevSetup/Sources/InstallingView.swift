import SwiftUI

struct InstallingView: View {
    @EnvironmentObject var vm: InstallerViewModel

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 40)

            // 타이틀
            Text("환경 세팅 중")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.textPrimary)

            Spacer().frame(height: 24)

            // 도트 진행률
            DotProgressView(
                totalSteps: vm.totalSteps,
                completedSteps: vm.completedSteps,
                currentStep: vm.currentStepIndex
            )

            Spacer().frame(height: 8)

            // 진행 텍스트
            Text("\(vm.completedSteps) / \(vm.totalSteps) 단계")
                .font(.system(size: 13))
                .foregroundColor(.textSecondary)

            Spacer().frame(height: 28)

            // 단계 목록
            ScrollView {
                VStack(spacing: 6) {
                    ForEach(vm.steps) { step in
                        StepRow(step: step, total: vm.totalSteps)
                    }
                }
                .padding(.horizontal, 40)
            }
            .frame(maxHeight: 340)

            Spacer().frame(height: 16)

            // 로그 토글
            Button(action: { withAnimation { vm.showLog.toggle() } }) {
                HStack(spacing: 4) {
                    Image(systemName: vm.showLog ? "chevron.down" : "chevron.right")
                        .font(.system(size: 11))
                    Text("로그 보기")
                        .font(.system(size: 13))
                }
                .foregroundColor(.textSecondary)
            }
            .buttonStyle(.plain)

            if vm.showLog {
                ScrollView {
                    Text(vm.logOutput)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                }
                .frame(height: 100)
                .background(Color.bgCard)
                .cornerRadius(8)
                .padding(.horizontal, 40)
                .padding(.top, 8)
            }

            Spacer()
        }
    }
}

// MARK: - 단계 행
struct StepRow: View {
    let step: InstallStep
    let total: Int

    var body: some View {
        HStack(spacing: 12) {
            // 상태 아이콘
            stepIcon

            // 단계명
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 0) {
                    Text("[\(step.id)/\(total)] ")
                        .foregroundColor(.textSecondary)
                    Text(step.name)
                        .foregroundColor(step.status == .pending ? .textSecondary.opacity(0.5) : .textPrimary)
                }
                .font(.system(size: 14, weight: step.status == .running ? .semibold : .regular))

                if let message = step.message {
                    HStack(spacing: 4) {
                        Text(message)
                            .font(.system(size: 12))
                            .foregroundColor(.textSecondary)
                        if step.status == .running {
                            LoadingDots()
                        }
                    }
                }
            }

            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            step.status == .running
                ? Color.accentBlue.opacity(0.08)
                : Color.clear
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(
                    step.status == .running ? Color.accentBlue.opacity(0.25) : Color.clear,
                    lineWidth: 1
                )
        )
        .cornerRadius(10)
    }

    @ViewBuilder
    private var stepIcon: some View {
        switch step.status {
        case .done:
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.successGreen)
                .font(.system(size: 18))
                .transition(.scale.combined(with: .opacity))
        case .running:
            ZStack {
                Circle()
                    .fill(Color.accentBlue)
                    .frame(width: 18, height: 18)
                Circle()
                    .fill(Color.accentBlue)
                    .frame(width: 18, height: 18)
                    .glow(.accentGlow, radius: 4)
            }
        case .error:
            Image(systemName: "xmark.circle.fill")
                .foregroundColor(.errorRed)
                .font(.system(size: 18))
        case .pending:
            Circle()
                .stroke(Color.dotInactive, lineWidth: 1.5)
                .frame(width: 16, height: 16)
        }
    }
}
