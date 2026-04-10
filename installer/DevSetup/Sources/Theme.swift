import SwiftUI

// MARK: - Color Theme
extension Color {
    static let bgPrimary = Color(red: 0.07, green: 0.07, blue: 0.10)
    static let bgSecondary = Color(red: 0.10, green: 0.10, blue: 0.14)
    static let bgCard = Color(red: 0.12, green: 0.12, blue: 0.17)
    static let accentBlue = Color(red: 0.25, green: 0.52, blue: 1.0)
    static let accentGlow = Color(red: 0.30, green: 0.55, blue: 1.0)
    static let dotInactive = Color(red: 0.25, green: 0.25, blue: 0.30)
    static let textPrimary = Color.white
    static let textSecondary = Color(red: 0.60, green: 0.62, blue: 0.68)
    static let successGreen = Color(red: 0.20, green: 0.78, blue: 0.35)
    static let errorRed = Color(red: 0.95, green: 0.30, blue: 0.30)
}

// MARK: - Glow Modifier
struct GlowEffect: ViewModifier {
    let color: Color
    let radius: CGFloat

    func body(content: Content) -> some View {
        content
            .shadow(color: color.opacity(0.6), radius: radius)
            .shadow(color: color.opacity(0.3), radius: radius * 2)
    }
}

extension View {
    func glow(_ color: Color = .accentGlow, radius: CGFloat = 8) -> some View {
        modifier(GlowEffect(color: color, radius: radius))
    }
}
