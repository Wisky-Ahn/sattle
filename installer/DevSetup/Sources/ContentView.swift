import SwiftUI

struct ContentView: View {
    @EnvironmentObject var vm: InstallerViewModel

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            switch vm.phase {
            case .welcome:
                WelcomeView()
            case .installing:
                InstallingView()
            case .success:
                SuccessView()
            case .failure:
                FailureView()
            }
        }
        .preferredColorScheme(.dark)
    }
}
