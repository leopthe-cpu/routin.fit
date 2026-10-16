import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { workoutLog, seriesByExercise, planStats } from '../lib/progress';
import { exerciseKey } from '../lib/weights';
import { convert, formatWeight, roundTo } from '../lib/units';
import { fromISODate } from '../lib/dates';
import RangeChart from '../components/RangeChart';

function StatTile({ label, value, note }) {
  return (
    <div className="glass p-3">
      <p className="text-xs text-3">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</p>
      {note && <p className="text-[11px] text-3">{note}</p>}
    </div>
  );
}

function ExerciseProgress({ series, unit }) {
  const first = series.points[0];
  const last = series.points[series.points.length - 1];
  const show = (kg) => roundTo(convert(kg, 'kg', unit), unit === 'kg' ? 0.5 : 1);
  const delta = show(last.max) - show(first.max);
  const since = fromISODate(first.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  return (
    <div className="glass p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{series.name}</h3>
          <p className="text-xs text-3">
            {series.points.length} session{series.points.length === 1 ? '' : 's'} · heaviest set per day
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold tabular-nums">{formatWeight(show(last.max), unit)}</p>
          {series.points.length > 1 && (
            <p className="text-[11px] tabular-nums text-2">
              {delta > 0 ? '+' : ''}
              {formatWeight(roundTo(delta, 0.5), unit)} since {since}
            </p>
          )}
        </div>
      </div>
      <RangeChart points={series.points} unit={unit} label={series.name} />
    </div>
  );
}

export default function ProgressScreen() {
  const history = useStore((s) => s.history);
  const sessions = useStore((s) => s.sessions);
  const unit = useStore((s) => s.settings.unit);
  const plan = useStore((s) => s.activePlan());
  const [showOther, setShowOther] = useState(false);

  const { stats, inPlan, other } = useMemo(() => {
    const state = { history, sessions };
    const series = seriesByExercise(workoutLog(state));
    const planKeys = [];
    for (const day of Object.values(plan?.days ?? {})) {
      for (const ex of day.exercises) {
        const k = exerciseKey(ex.name);
        if (!planKeys.includes(k)) planKeys.push(k);
      }
    }
    const recent = (a, b) => b.points[b.points.length - 1].date.localeCompare(a.points[a.points.length - 1].date);
    return {
      stats: planStats(state),
      inPlan: planKeys.map((k) => series.get(k)).filter(Boolean),
      other: [...series.values()].filter((s) => !planKeys.includes(s.key)).sort(recent),
    };
  }, [history, sessions, plan]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">Progress</h1>
        <p className="text-sm text-2">
          {stats.firstDate
            ? `Training since ${fromISODate(stats.firstDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
            : 'Finish a workout to start tracking.'}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Workouts" value={stats.workouts} note="all time" />
        <StatTile label="This week" value={stats.thisWeek} note="workouts" />
        <StatTile label="Week streak" value={stats.streak} note="weeks in a row" />
        <StatTile label="Morning stretches" value={stats.morning} note="completed" />
      </div>

      {inPlan.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-3">In your plan</h2>
          {inPlan.map((s) => (
            <ExerciseProgress key={s.key} series={s} unit={unit} />
          ))}
        </section>
      )}

      {other.length > 0 && (
        <section className="space-y-3">
          <button onClick={() => setShowOther((v) => !v)} className="text-xs font-semibold uppercase tracking-wider text-3">
            {showOther ? '▾' : '▸'} Other exercises ({other.length})
          </button>
          {showOther && other.map((s) => <ExerciseProgress key={s.key} series={s} unit={unit} />)}
        </section>
      )}

      {!inPlan.length && !other.length && (
        <p className="glass p-4 text-sm text-2">
          Weights appear here once you tick sets with a weight saved, or import your history in Settings.
        </p>
      )}
    </div>
  );
}
