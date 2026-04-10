// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DevSetup",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "DevSetup",
            path: "Sources"
        )
    ]
)
