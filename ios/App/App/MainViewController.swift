import Capacitor
import UIKit

/// The app's web view, plus the plugins that live in this project rather than in npm.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(GoodaysNativePlugin())
    }
}
