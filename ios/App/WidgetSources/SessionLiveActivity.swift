import ActivityKit
import SwiftUI
import WidgetKit

/// The running session on the Lock Screen and in the Dynamic Island.
struct SessionLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: GoodaysActivityAttributes.self) { context in
            LockScreenView(kind: context.attributes.kind, state: context.state)
                .activityBackgroundTint(Look.night)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: symbol(context.attributes.kind))
                        .font(.title2)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    SessionTime(state: context.state)
                        .font(.title2.weight(.light).monospacedDigit())
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 110, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.title)
                        .font(.headline)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(context.state.status.uppercased())
                            .font(.caption2.monospaced())
                            .opacity(0.7)
                        ProgressView(value: min(1, context.state.fraction))
                            .tint(.white)
                    }
                }
            } compactLeading: {
                Image(systemName: symbol(context.attributes.kind))
            } compactTrailing: {
                SessionTime(state: context.state)
                    .monospacedDigit()
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 48)
            } minimal: {
                Image(systemName: symbol(context.attributes.kind))
            }
        }
    }
}

/// A countdown or a count-up that the phone ticks by itself, or a fixed time while paused.
struct SessionTime: View {
    let state: GoodaysActivityAttributes.ContentState

    var body: some View {
        if state.paused {
            Text(clock(state.seconds))
        } else if state.countsDown, let end = state.endsAt {
            Text(timerInterval: Date.now...max(end, Date.now), countsDown: true)
        } else if let start = state.startedAt {
            Text(start, style: .timer)
        } else {
            Text(clock(state.seconds))
        }
    }
}

struct LockScreenView: View {
    let kind: String
    let state: GoodaysActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: symbol(kind))
                    .font(.title3)
                    .frame(width: 36, height: 36)
                    .background(.white.opacity(0.14), in: Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.title)
                        .font(.headline)
                        .lineLimit(1)
                    Text(state.status.uppercased())
                        .font(.caption2.monospaced())
                        .opacity(0.7)
                }
                Spacer(minLength: 8)
                SessionTime(state: state)
                    .font(.system(size: 34, weight: .light).monospacedDigit())
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 130, alignment: .trailing)
            }
            ProgressView(value: min(1, state.fraction))
                .tint(.white)
        }
        .padding(16)
        .foregroundStyle(.white)
    }
}
