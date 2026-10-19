import ActivityKit
import Capacitor
import Foundation
import WidgetKit

/// The web app's way into iOS-only features: the Live Activity and widget data.
/// The JavaScript side is src/native/index.js.
@objc(GoodaysNativePlugin)
public class GoodaysNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GoodaysNativePlugin"
    public let jsName = "GoodaysNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setWidgetData", returnType: CAPPluginReturnPromise)
    ]

    /// Starts the Live Activity for this kind of session, or updates the one already showing.
    @objc func updateActivity(_ call: CAPPluginCall) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve(["shown": false])
            return
        }
        let kind = call.getString("kind", "workout")
        let endsAt = call.getDouble("endsAt", 0)
        let startedAt = call.getDouble("startedAt", 0)
        let state = GoodaysActivityAttributes.ContentState(
            title: call.getString("title", ""),
            status: call.getString("status", ""),
            fraction: call.getDouble("fraction", 0),
            paused: call.getBool("paused", false),
            countsDown: call.getBool("countsDown", false),
            endsAt: endsAt > 0 ? Date(timeIntervalSince1970: endsAt) : nil,
            startedAt: startedAt > 0 ? Date(timeIntervalSince1970: startedAt) : nil,
            seconds: call.getInt("seconds", 0)
        )
        let content = ActivityContent(state: state, staleDate: nil)
        Task {
            let running = Activity<GoodaysActivityAttributes>.activities
            let same = running.first { $0.attributes.kind == kind }
            // One thing at a time: anything else showing ends.
            for other in running where other.id != same?.id {
                await other.end(nil, dismissalPolicy: .immediate)
            }
            if let same {
                await same.update(content)
                call.resolve(["shown": true])
                return
            }
            do {
                _ = try Activity.request(attributes: GoodaysActivityAttributes(kind: kind), content: content, pushType: nil)
                call.resolve(["shown": true])
            } catch {
                call.reject("Couldn't start the Live Activity", nil, error)
            }
        }
    }

    @objc func endActivity(_ call: CAPPluginCall) {
        Task {
            for activity in Activity<GoodaysActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            call.resolve()
        }
    }

    /// Saves today's numbers (JSON from the web app) where the widgets read them, and redraws the widgets.
    @objc func setWidgetData(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let defaults = UserDefaults(suiteName: goodaysAppGroup) else {
            call.reject("Widget storage is unavailable")
            return
        }
        defaults.set(json, forKey: "today")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
