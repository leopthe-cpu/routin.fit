import { Check, Dumbbell, Flower2, Moon, PersonStanding } from 'lucide-react';
import { useStore } from '../../store';
import { dayKeyOf, fromISODate } from '../../lib/dates';
import { formatAlarm, nextAlarmDay } from '../../lib/alarm';
import GoalsSection from '../GoalsSection';
import { Eyebrow, GlassButton, GlassCard } from './parts';

/** A rest day: what the plan suggests, and gentle things to do instead of training. */
export function RestDay({ date, onSwitch }) {
  const plan = useStore((s) => s.activePlan());
  const day = plan?.days[dayKeyOf(fromISODate(date))];
  const when = fromISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  return (
    <GlassCard className="mt-auto gap-3">
      <Eyebrow>Rest day · {when}</Eyebrow>
      <div className="flex items-center gap-2">
        <Moon className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-[28px] font-light">Rest &amp; recover</span>
      </div>
      {day?.notes?.length ? (
        <ul className="flex flex-col gap-1.5 text-[16px] leading-snug opacity-90">
          {day.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[16px] leading-snug opacity-90">No training today. Muscles grow while they rest.</p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {day?.morning && (
          <GlassButton onClick={() => onSwitch('morning')}>
            <PersonStanding className="h-4 w-4" /> Stretch
          </GlassButton>
        )}
        <GlassButton onClick={() => onSwitch('meditate')}>
          <Flower2 className="h-4 w-4" /> Meditate
        </GlassButton>
        {day?.exercises?.length > 0 && (
          <GlassButton onClick={() => onSwitch('workout')}>
            <Dumbbell className="h-4 w-4" /> Workout
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
}

/** Today's goals to tick, and the full list to add or remove goals. */
export function GoalsView({ date }) {
  const goals = useStore((s) => s.goals);
  const checks = useStore((s) => s.goalChecks);
  const toggleGoal = useStore((s) => s.toggleGoal);
  const dayKey = dayKeyOf(fromISODate(date));
  const today = goals.filter((g) => g.days.includes(dayKey));
  return (
    <div className="mt-auto flex flex-col gap-3">
      {today.length > 0 && (
        <GlassCard className="gap-2">
          <Eyebrow>Today</Eyebrow>
          {today.map((g) => {
            const on = !!checks[`${date}|${g.id}`];
            return (
              <button
                key={g.id}
                onClick={() => toggleGoal(date, g.id)}
                aria-pressed={on}
                className="flex min-h-[48px] items-center gap-3 text-left text-[18px]"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: on ? 'var(--accent)' : 'transparent',
                    color: 'var(--on-accent)',
                    border: `1.5px solid ${on ? 'transparent' : 'currentColor'}`,
                  }}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <span className={on ? 'line-through opacity-60' : ''}>{g.title}</span>
              </button>
            );
          })}
        </GlassCard>
      )}
      <GlassCard className="gap-2">
        <GoalsSection />
      </GlassCard>
    </div>
  );
}

/** Set the daily wake-up time and switch it on or off. */
export function AlarmEditor() {
  const alarm = useStore((s) => s.alarm);
  const setAlarm = useStore((s) => s.setAlarm);
  const day = nextAlarmDay(alarm);
  return (
    <GlassCard className="mt-auto gap-4">
      <Eyebrow>Alarm</Eyebrow>
      <div className="flex items-center justify-between gap-4">
        {/* Big readable time; the invisible time input on top opens the phone's own picker. */}
        <label className="relative min-w-0 flex-1 cursor-pointer" style={{ opacity: alarm.on ? 1 : 0.5 }}>
          <span className="block text-[52px] font-light leading-none tabular-nums">{formatAlarm(alarm.time)}</span>
          <input
            type="time"
            value={alarm.time}
            onChange={(e) => e.target.value && setAlarm({ time: e.target.value, lastRang: null })}
            onClick={(e) => e.currentTarget.showPicker?.()}
            aria-label="Alarm time"
            className="absolute inset-0 h-full w-full opacity-0"
          />
        </label>
        <button
          role="switch"
          aria-checked={alarm.on}
          aria-label="Alarm on"
          onClick={() => setAlarm({ on: !alarm.on, lastRang: null })}
          className="relative h-8 w-14 shrink-0 rounded-full transition"
          style={{ background: alarm.on ? 'var(--accent)' : 'var(--track)', border: '1px solid var(--glass-border)' }}
        >
          <span
            className="absolute top-1 h-6 w-6 rounded-full transition-all"
            style={{ left: alarm.on ? '1.65rem' : '0.25rem', background: alarm.on ? 'var(--on-accent)' : 'currentColor' }}
          />
        </button>
      </div>
      <p className="text-[16px] opacity-90">{day ? `Rings ${day.toLowerCase()} · every day` : 'Off'}</p>
      <p className="text-sm leading-snug opacity-75">
        A gentle chime and a sunrise screen while the app is open. Alarms that ring with the phone locked come with the
        iPhone app.
      </p>
    </GlassCard>
  );
}
