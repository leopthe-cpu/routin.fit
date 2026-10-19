import ActivityKit
import Foundation

// Shared by the app and the GoodaysWidgets extension: in Xcode, this file's
// Target Membership has both App and GoodaysWidgets ticked.

/// The App Group both targets use to share today's numbers with the widgets.
/// It must match the App Group added under Signing & Capabilities on both targets.
let goodaysAppGroup = "group.world.goodays.app"

/// What the Lock Screen and Dynamic Island show while a session runs.
struct GoodaysActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var title: String
        var status: String
        var fraction: Double
        var paused: Bool
        /// A rest, move or meditation timer counting down to `endsAt`; otherwise time so far since `startedAt`.
        var countsDown: Bool
        var endsAt: Date?
        var startedAt: Date?
        /// The value to show while paused (the phone ticks the clock itself otherwise).
        var seconds: Int
    }

    /// "workout", "morning" (stretches) or "meditate".
    var kind: String
}
