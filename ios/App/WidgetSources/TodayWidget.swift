import SwiftUI
import WidgetKit

/// Today's numbers as the app last saved them (src/native/NativeSync.jsx writes this JSON).
struct TodaySnapshot: Codable {
    struct Line: Codable {
        let title: String
        let status: String
    }

    struct Week: Codable {
        let pct: Int
        let done: Int
        let planned: Int
    }

    let date: String
    let name: String
    let stretch: Line?
    let workout: Line?
    let goals: Line
    let week: Week?
    let alarm: String?

    static let sample = TodaySnapshot(
        date: isoDay(.now),
        name: "",
        stretch: Line(title: "Morning flow", status: "To do"),
        workout: Line(title: "Upper Body", status: "To do"),
        goals: Line(title: "Walk 8k steps", status: "0 of 2 today"),
        week: Week(pct: 40, done: 2, planned: 5),
        alarm: "06:30"
    )

    static func load() -> TodaySnapshot? {
        guard
            let json = UserDefaults(suiteName: goodaysAppGroup)?.string(forKey: "today"),
            let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode(TodaySnapshot.self, from: data)
    }
}

/// "2026-10-19" in the phone's time zone, the same format the app uses.
func isoDay(_ date: Date) -> String {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
}

struct TodayEntry: TimelineEntry {
    let date: Date
    let snapshot: TodaySnapshot?

    /// Yesterday's numbers don't count once the day has turned.
    var today: TodaySnapshot? {
        guard let snapshot, snapshot.date == isoDay(date) else { return nil }
        return snapshot
    }
}

struct TodayProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodayEntry {
        TodayEntry(date: .now, snapshot: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        completion(TodayEntry(date: .now, snapshot: context.isPreview ? .sample : TodaySnapshot.load() ?? .sample))
    }

    /// Now, and again at midnight so a new day shows fresh. The app also redraws the widgets whenever something changes.
    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        let now = Date.now
        let snapshot = TodaySnapshot.load()
        let midnight = Calendar.current.date(byAdding: .day, value: 1, to: Calendar.current.startOfDay(for: now)) ?? now.addingTimeInterval(86_400)
        let entries = [TodayEntry(date: now, snapshot: snapshot), TodayEntry(date: midnight, snapshot: snapshot)]
        completion(Timeline(entries: entries, policy: .after(midnight)))
    }
}

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "GoodaysToday", provider: TodayProvider()) { entry in
            TodayWidgetView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Your stretch, workout, goals and week at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct TodayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TodayEntry

    var body: some View {
        content
            .containerBackground(for: .widget) {
                if family == .systemSmall || family == .systemMedium {
                    Look.sky
                } else {
                    Color.clear
                }
            }
    }

    @ViewBuilder private var content: some View {
        switch family {
        case .accessoryInline: inline
        case .accessoryCircular: circular
        case .accessoryRectangular: rectangular
        case .systemMedium: medium
        default: small
        }
    }

    private var label: some View {
        Text(entry.date.formatted(.dateTime.weekday(.wide)).uppercased())
            .font(.caption2.monospaced())
            .opacity(0.75)
    }

    private func row(_ icon: String, _ line: TodaySnapshot.Line) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .frame(width: 14)
            Text(line.title)
                .font(.subheadline)
                .lineLimit(1)
            Spacer(minLength: 4)
            Text(line.status)
                .font(.caption2.monospaced())
                .opacity(0.75)
                .lineLimit(1)
        }
    }

    private func weekBar(_ week: TodaySnapshot.Week) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("THIS WEEK · \(week.pct)%")
                .font(.caption2.monospaced())
                .opacity(0.75)
            ProgressView(value: Double(week.pct) / 100)
                .tint(.white)
        }
    }

    private var newDay: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("A new day")
                .font(.title3.weight(.light))
            Text("Open goodays to begin")
                .font(.caption)
                .opacity(0.75)
        }
    }

    private var small: some View {
        VStack(alignment: .leading, spacing: 6) {
            label
            Spacer(minLength: 0)
            if let s = entry.today {
                if let workout = s.workout {
                    Text(workout.title)
                        .font(.headline)
                        .lineLimit(2)
                    Text(workout.status)
                        .font(.caption2.monospaced())
                        .opacity(0.75)
                }
                Spacer(minLength: 0)
                if let week = s.week { weekBar(week) }
            } else {
                newDay
            }
        }
        .foregroundStyle(.white)
    }

    private var medium: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                label
                Spacer()
                if let alarm = entry.today?.alarm {
                    Label(alarm, systemImage: "bell")
                        .font(.caption2.monospaced())
                        .opacity(0.75)
                }
            }
            if let s = entry.today {
                if let stretch = s.stretch { row("figure.flexibility", stretch) }
                if let workout = s.workout { row(s.workout?.status == "Rest" ? "moon" : "dumbbell.fill", workout) }
                row("target", s.goals)
                Spacer(minLength: 0)
                if let week = s.week { weekBar(week) }
            } else {
                Spacer(minLength: 0)
                newDay
                Spacer(minLength: 0)
            }
        }
        .foregroundStyle(.white)
    }

    private var circular: some View {
        let pct = entry.today?.week?.pct ?? 0
        return Gauge(value: Double(pct), in: 0...100) {
            Image(systemName: "sun.max")
        } currentValueLabel: {
            Text("\(pct)")
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 1) {
            if let s = entry.today {
                Text(s.workout?.title ?? "Today")
                    .font(.headline)
                    .lineLimit(1)
                Text(s.workout?.status ?? "")
                    .font(.caption)
                Text(s.goals.title)
                    .font(.caption)
                    .lineLimit(1)
            } else {
                Text("goodays")
                    .font(.headline)
                Text("A new day")
                    .font(.caption)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder private var inline: some View {
        if let s = entry.today, let workout = s.workout {
            Text("\(workout.title) · \(workout.status)")
        } else {
            Text("goodays · a new day")
        }
    }
}
