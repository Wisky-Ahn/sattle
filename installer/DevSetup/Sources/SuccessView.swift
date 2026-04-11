import SwiftUI
import AppKit

struct SuccessView: View {
    @EnvironmentObject var vm: InstallerViewModel
    @State private var dotsVisible = true
    @State private var checkVisible = false
    @State private var contentVisible = false
    @State private var logExpanded = false
    @State private var copied = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer().frame(height: 60)

                // 도트 → 체크마크 전환 애니메이션
                ZStack {
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
                    VStack(spacing: 0) {
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

                        Divider().background(Color.textSecondary.opacity(0.15))

                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.25)) {
                                logExpanded.toggle()
                            }
                        }) {
                            HStack(spacing: 8) {
                                Image(systemName: logExpanded ? "chevron.down" : "chevron.right")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.textSecondary)
                                Text("자세한 로그")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.textPrimary)
                                Spacer()
                                Text(logExpanded ? "숨기기" : "보기")
                                    .font(.system(size: 12))
                                    .foregroundColor(.textSecondary)
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 14)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)

                        if logExpanded {
                            VStack(spacing: 10) {
                                ScrollView {
                                    Text(vm.logOutput.isEmpty ? "수집된 로그가 없습니다." : vm.logOutput)
                                        .font(.system(size: 11, design: .monospaced))
                                        .foregroundColor(.textSecondary)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .textSelection(.enabled)
                                        .padding(12)
                                }
                                .frame(height: 220)
                                .background(Color.black.opacity(0.35))
                                .cornerRadius(8)

                                HStack {
                                    Spacer()
                                    Button(action: copyLog) {
                                        HStack(spacing: 6) {
                                            Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                                .font(.system(size: 11))
                                            Text(copied ? "복사됨" : "로그 복사")
                                                .font(.system(size: 12))
                                        }
                                        .foregroundColor(.textSecondary)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.bottom, 16)
                        }
                    }
                    .background(Color.bgCard)
                    .cornerRadius(12)
                    .padding(.horizontal, 60)

                    Spacer().frame(height: 24)

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

                    Spacer().frame(height: 40)
                }
            }
        }
        .onAppear { runAnimation() }
    }

    private func runAnimation() {
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

    private func copyLog() {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(vm.logOutput, forType: .string)
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            copied = false
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
