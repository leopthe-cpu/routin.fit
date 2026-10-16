import { ChevronLeft, ChevronRight, Dumbbell, Moon, Sun } from 'lucide-react';
import { useStore, sessionKey, sessionProgress, sessionStatus as statusOf } from '../store';
import { weekDates, todayISO, planWeek, fromISODate } from '../lib/dates';
import { morningCopy, workoutCopy } from '../lib/estimate';
import DayCard from '../components/DayCard';

const LONG_DAY = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

export default function WeekScreen({ selectedDate, onSelectDate, onOpenSession }) {
  const plan = useStore((s) => s.activePlan());
  const sessions = useStore((s) => s.sessions);
  const today = todayISO();
  const selected = fromISODate(selectedDate);
  const week = weekDates(selected);

  if (!plan) {
    return <p className="glass p-4 text-sm text-2">No plan yet. Add one on the Plans tab.</p>;
  }

  const dayStatus = (iso, key) => {
    const day = plan.days[key];
    const kinds = [day.morning && 'morning', day.exercises.length && 'workout'].filter(Boolean);
    const states = kinds.map((k) => statusOf(sessions[sessionKey(iso, k)]));
    if (states.length && states.every((s) => s === 'done')) return 'done';
    if (states.length && states.every((s) => s === 'done' || s === 'partial')) return 'partial';
    if (states.some((s) => s !== 'todo')) return 'progress';
    return 'todo';
  };

  const shiftWeek = (n) => {
    const d = new Date(selected);
    d.setDate(d.getDate() + n * 7);
    onSelectDate(weekDates(d).find((w) => w.key === week.find((x) => x.iso === selectedDate).key).iso);
  };

  const current = week.find((w) => w.iso === selectedDate);
  const day = plan.days[current.key];

  const cardFor = (kind) => {
    const session = sessions[sessionKey(selectedDate, kind)];
    const status = statusOf(session);
    const { done, total } = sessionProgress(session);
    const copy = kind === 'morning' ? morningCopy(day.morning) : workoutCopy(day);
    return (
      <DayCard
        key={kind}
        icon={kind === 'morning' ? Sun : Dumbbell}
        accent={kind === 'morning' ? 'var(--accent)' : 'var(--accent)'}
        {...copy}
        status={status}
        progressText={status === 'progress' || status === 'partial' ? `${done}/${total}` : ''}
        onClick={() => onOpenSession(selectedDate, kind)}
      />
    );
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-3">
          {plan.name} · Week {planWeek(plan.startDate, selectedDate)}
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          {selectedDate === today ? 'Today' : LONG_DAY[current.key]}
        </h1>
        <p className="text-sm text-2">
          {day.isRest ? 'Rest day' : day.title} ·{' '}
          {selected.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </p>
      </header>

      <div className="flex items-center gap-1">
        <button aria-label="Previous week" onClick={() => shiftWeek(-1)} className="p-1 text-3">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {week.map((w) => {
            const isSel = w.iso === selectedDate;
            const st = dayStatus(w.iso, w.key);
            return (
              <button
                key={w.iso}
                onClick={() => onSelectDate(w.iso)}
                className="flex flex-col items-center rounded-xl py-2 transition"
                style={{
                  background: isSel ? 'rgb(var(--ink-rgb) / 0.12)' : 'rgb(var(--ink-rgb) / 0.04)',
                  border: `1px solid ${isSel ? 'rgb(var(--ink-rgb) / 0.25)' : 'rgb(var(--ink-rgb) / 0.06)'}`,
                }}
              >
                <span className={`text-[11px] ${w.iso === today ? 'font-bold text-white' : 'text-3'}`}>{w.key}</span>
                <span className="text-sm font-semibold">{w.date.getDate()}</span>
                <span
                  className="mt-1 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: st === 'done' ? '#4ade80' : st === 'partial' ? '#fbbf24' : st === 'progress' ? 'var(--accent)' : plan.days[w.key].isRest ? 'transparent' : 'rgb(var(--ink-rgb) / 0.2)',
                  }}
                />
              </button>
            );
          })}
        </div>
        <button aria-label="Next week" onClick={() => shiftWeek(1)} className="p-1 text-3">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {day.morning && cardFor('morning')}
        {day.exercises.length > 0 && cardFor('workout')}
        {day.exercises.length === 0 && (
          <div className="glass p-4">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <h3 className="text-[15px] font-semibold">Rest & recover</h3>
            </div>
            {day.notes.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-sm text-2">
                {day.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-2">No workout planned. Let your body recover.</p>
            )}
          </div>
        )}
        {day.exercises.length > 0 && day.notes.length > 0 && (
          <ul className="space-y-1 px-1 text-xs text-3">
            {day.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
