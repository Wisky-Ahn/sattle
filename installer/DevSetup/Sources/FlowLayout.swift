import SwiftUI

// macOS 13+ 용 Flow Layout (태그 줄바꿈)
struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var totalHeight: CGFloat = 0
        var currentLineWidth: CGFloat = 0
        var currentLineHeight: CGFloat = 0
        var maxLineWidth: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentLineWidth + size.width > maxWidth && currentLineWidth > 0 {
                totalHeight += currentLineHeight + spacing
                maxLineWidth = max(maxLineWidth, currentLineWidth - spacing)
                currentLineWidth = 0
                currentLineHeight = 0
            }
            currentLineWidth += size.width + spacing
            currentLineHeight = max(currentLineHeight, size.height)
        }
        totalHeight += currentLineHeight
        maxLineWidth = max(maxLineWidth, currentLineWidth - spacing)

        return CGSize(width: maxLineWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width

        // 각 줄의 너비를 계산해서 중앙 정렬하기 위한 사전 처리
        var lines: [[(index: Int, size: CGSize)]] = [[]]
        var currentLineWidth: CGFloat = 0

        for (i, subview) in subviews.enumerated() {
            let size = subview.sizeThatFits(.unspecified)
            if currentLineWidth + size.width > maxWidth && currentLineWidth > 0 {
                lines.append([])
                currentLineWidth = 0
            }
            lines[lines.count - 1].append((i, size))
            currentLineWidth += size.width + spacing
        }

        var y: CGFloat = bounds.minY
        for line in lines {
            let lineWidth = line.reduce(0) { $0 + $1.size.width } + CGFloat(max(0, line.count - 1)) * spacing
            var x = bounds.minX + (maxWidth - lineWidth) / 2 // 중앙 정렬
            let lineHeight = line.map(\.size.height).max() ?? 0

            for item in line {
                subviews[item.index].place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(item.size))
                x += item.size.width + spacing
            }
            y += lineHeight + spacing
        }
    }
}
