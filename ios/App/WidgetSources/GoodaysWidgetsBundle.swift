import SwiftUI
import WidgetKit

/// Everything the GoodaysWidgets extension offers: the Today widget and the session Live Activity.
@main
struct GoodaysWidgetsBundle: WidgetBundle {
    var body: some Widget {
        TodayWidget()
        SessionLiveActivity()
    }
}

// Shared look and helpers.

enum Look {
    static let night = Color(red: 0.055, green: 0.10, blue: 0.23)
    static let dusk = Color(red: 0.17, green: 0.23, blue: 0.40)
    static let glow = Color(red: 0.85, green: 0.54, blue: 0.37)
    static let sky = LinearGradient(colors: [night, dusk, glow], startPoint: .top, endPoint: .bottom)
}

/// SF Symbol for each kind of session.
func symbol(_ kind: String) -> String {
    switch kind {
    case "morning": return "figure.flexibility"
    case "meditate": return "figure.mind.and.body"
    default: return "dumbbell.fill"
    }
}

/// 75 -> "1:15"
func clock(_ seconds: Int) -> String {
    let s = max(0, seconds)
    return s >= 3600
        ? String(format: "%d:%02d:%02d", s / 3600, (s / 60) % 60, s % 60)
        : String(format: "%d:%02d", s / 60, s % 60)
}
