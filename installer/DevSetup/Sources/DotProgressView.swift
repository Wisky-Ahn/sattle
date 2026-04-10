import SwiftUI

// MARK: - 상단 도트 진행률
struct DotProgressView: View {
    let totalSteps: Int
    let completedSteps: Int
    let currentStep: Int

    var body: some View {
        HStack(spacing: 10) {
            ForEach(0..<totalSteps, id: \.self) { index in
                DotView(
                    state: dotState(for: index),
                    index: index
                )
            }
        }
    }

    private func dotState(for index: Int) -> DotState {
        if index < completedSteps {
            return .completed
        } else if index == currentStep {
            return .active
        }
        return .pending
    }
}

enum DotState {
    case pending, active, completed
}

// MARK: - 개별 도트
struct DotView: View {
    let state: DotState
    let index: Int

    @State private var pulse = false

    var body: some View {
        Circle()
            .fill(fillColor)
            .frame(width: dotSize, height: dotSize)
            .scaleEffect(state == .active && pulse ? 1.3 : 1.0)
            .modifier(ConditionalGlow(isActive: state == .active || state == .completed))
            .animation(
                state == .active
                    ? .easeInOut(duration: 0.8).repeatForever(autoreverses: true)
                    : .spring(response: 0.4, dampingFraction: 0.6),
                value: pulse
            )
            .animation(.spring(response: 0.4, dampingFraction: 0.6), value: state)
            .onAppear {
                if state == .active { pulse = true }
            }
            .onChange(of: state) { _, newState in
                pulse = newState == .active
            }
    }

    private var fillColor: Color {
        switch state {
        case .completed: return .accentBlue
        case .active: return .accentBlue
        case .pending: return .dotInactive
        }
    }

    private var dotSize: CGFloat {
        switch state {
        case .active: return 14
        case .completed: return 12
        case .pending: return 10
        }
    }
}

struct ConditionalGlow: ViewModifier {
    let isActive: Bool

    func body(content: Content) -> some View {
        if isActive {
            content.glow(.accentGlow, radius: 6)
        } else {
            content
        }
    }
}

// MARK: - 로딩 도트 애니메이션 (● · ·)
struct LoadingDots: View {
    @State private var activeDot = 0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(index == activeDot ? Color.accentBlue : Color.accentBlue.opacity(0.3))
                    .frame(width: 6, height: 6)
                    .scaleEffect(index == activeDot ? 1.2 : 0.8)
                    .animation(.easeInOut(duration: 0.4), value: activeDot)
            }
        }
        .onAppear {
            Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
                activeDot = (activeDot + 1) % 3
            }
        }
    }
}
