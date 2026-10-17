import { AlarmClock, Check, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Dumbbell, Flower2, MapPin, Moon, PersonStanding, Sun } from 'lucide-react';
import { useStore, sessionKey, sessionProgress, sessionStatus } from '../store';
import { dayKeyOf, toISODate, weekDates } from '../lib/dates';
import { estimateWorkoutMinutes } from '../lib/estimate';
import { morningMinutes } from '../lib/morning';
import { useWeather } from '../hooks/useWeather';

const WEATHER_ICONS = { sun: Sun, moon: Moon, cloudsun: CloudSun, cloud: Cloud, fog: CloudFog, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };

function Weather() {
  const { enabled, enable, data, error, loading } = useWeather();
  if (!enabled) {
    return (
      <button onClick={enable} className="flex min-h-[44px] items-center gap-1.5 text-2" aria-label="Show local weather">
        <MapPin className="h-4 w-4" />
        <span className="label text-[10px]">Weather</span>
      </button>
    );
  }
  if (!data) {
    return (
      <span className="label max-w-[9rem] text-right text-[10px] text-3" title={error}>
        {loading ? 'Loading…' : error ? 'Weather off' : ''}
      </span>
    );
  }
  const Icon = WEATHER_ICONS[data.icon] ?? Cloud;
  return (
    <div className="flex items-center gap-2 text-2" title={error || undefined}>
      <Icon className="h-6 w-6" strokeWidth={1.4} style={{ color: 'var(--text-1)' }} />
      <span className="flex flex-col items-end">
        <span className="text-xl leading-tight" style={{ color: 'var(--text-1)' }}>
          {data.temp}°
        </span>
        <span className="label text-[9px]">{data.label}</span>
      </span>
    </div>
  );
}

function Clock({ now }) {
  const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(new Date(now));
  const period = parts.find((p) => p.type === 'dayPeriod')?.value;
  const time = parts
    .filter((p) => p.type !== 'dayPeriod')
    .map((p) => p.value)
    .join('')
    .trim();
  return (
    <div className="-mt-1 flex shrink-0 items-baseline gap-1.5">
      <span className="today-clock font-normal leading-none tracking-tight tabular-nums">{time}</span>
      {period && <span className="text-xl text-3">{period.toLowerCase()}</span>}
    </div>
  );
}

const STATUS_WORD = { todo: 'Start', progress: 'Resume', done: 'Done', partial: 'Ended' };

function Tile({ label, value, sub, status, icon: Icon, tint, onClick, ariaLabel, disabled }) {
  const done = status === 'Done';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="tile today-tile flex min-h-0 flex-col justify-between overflow-hidden rounded-[18px] text-left disabled:opacity-60"
      style={{
        background: `radial-gradient(120% 110% at 100% 0%, ${tint}3D 0%, ${tint}00 60%), var(--card-bg)`,
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <span className="flex w-full items-center justify-between">
        <span className="tile-label label text-2">{label}</span>
        <span
          aria-hidden="true"
          className="tile-chip flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: done ? 'rgba(34,197,94,0.2)' : 'rgb(var(--ink-rgb) / 0.07)' }}
        >
          {done ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: '#16a34a' }} />
          ) : (
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </span>
      </span>
      <span className="flex w-full flex-col gap-0.5">
        <span className="today-tile-value truncate leading-tight">{value}</span>
        <span className="flex items-baseline justify-between gap-1.5">
          <span className="tile-sub truncate text-xs text-3">{sub}</span>
          <span className="label shrink-0 text-[9px] text-2">{status}</span>
        </span>
      </span>
    </button>
  );
}

/** Share of this week's planned stretches and workouts that were done (ended with at least one tick). */
function weekProgress(plan, sessions, now) {
  let planned = 0;
  let workouts = 0;
  let stretches = 0;
  for (const w of weekDates(new Date(now))) {
    const day = plan.days[w.key];
    const counted = (kind) => {
      const s = sessions[sessionKey(w.iso, kind)];
      return !!s?.endedAt && sessionProgress(s).done > 0;
    };
    if (day.morning) {
      planned++;
      if (counted('morning')) stretches++;
    }
    if (day.exercises.length) {
      planned++;
      if (counted('workout')) workouts++;
    }
  }
  return { planned, workouts, stretches, pct: planned ? Math.round(((workouts + stretches) / planned) * 100) : 0 };
}

function WeekBar({ plan, sessions, now, sky }) {
  const { planned, workouts, stretches, pct } = weekProgress(plan, sessions, now);
  return (
    <div className="mt-auto flex shrink-0 flex-col gap-1.5">
      <div className="label flex justify-between text-2">
        <span>This week</span>
        <span>
          {workouts + stretches} of {planned} sessions
        </span>
      </div>
      <div className="today-week relative overflow-hidden rounded-[14px]" style={{ background: 'var(--track)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-[14px] transition-[width] duration-700"
          style={{ width: `${pct}%`, background: sky.bar }}
        />
        <span className="today-week-pct absolute left-4 top-1/2 -translate-y-1/2" style={{ color: pct > 12 ? '#16161a' : 'var(--text-1)' }}>
          {pct}
          <span className="text-[13px] opacity-60">%</span>
        </span>
        <span className="label absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-2">
          {workouts} workout{workouts === 1 ? '' : 's'} · {stretches} stretch{stretches === 1 ? '' : 'es'}
        </span>
      </div>
    </div>
  );
}

function Goals({ date, dayKey }) {
  const goals = useStore((s) => s.goals);
  const checks = useStore((s) => s.goalChecks);
  const toggleGoal = useStore((s) => s.toggleGoal);
  const today = goals.filter((g) => g.days.includes(dayKey));
  if (!today.length) return null;
  return (
    <div className="flex max-h-9 shrink-0 flex-wrap gap-1.5 overflow-hidden" aria-label="Goals today">
      {today.map((g) => {
        const on = !!checks[`${date}|${g.id}`];
        return (
          <button
            key={g.id}
            onClick={() => toggleGoal(date, g.id)}
            aria-pressed={on}
            className="tile flex h-9 max-w-full items-center gap-2 rounded-full pl-1.5 pr-3.5 text-left text-sm"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: on ? 'rgba(34,197,94,0.9)' : 'transparent', border: `1px solid ${on ? 'transparent' : 'var(--text-3)'}`, color: '#fff' }}
            >
              {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span className={`truncate ${on ? 'text-3 line-through' : ''}`}>{g.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function TodayScreen({ now, sky, onOpen }) {
  const plan = useStore((s) => s.activePlan());
  const sessions = useStore((s) => s.sessions);
  const date = new Date(now);
  const iso = toISODate(date);
  const dayKey = dayKeyOf(date);
  const day = plan?.days[dayKey];

  const tileState = (kind) => {
    const s = sessions[sessionKey(iso, kind)];
    const st = sessionStatus(s);
    if (st === 'progress') {
      const { done, total } = sessionProgress(s);
      return `${done}/${total}`;
    }
    return STATUS_WORD[st];
  };

  const planned = !day
    ? 'No plan yet'
    : [day.morning && 'Stretch', day.exercises.length ? day.title : 'Rest day'].filter(Boolean).join(', then ');

  return (
    // Sized to the screen: the tiles take whatever height is left, so Today never scrolls.
    <div className="today-stack flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="label text-[12px]" style={{ color: 'var(--text-1)' }}>
            {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="label truncate text-[9px] text-3">{planned}</span>
        </div>
        <Weather />
      </div>
      <Clock now={now} />

      {day && (
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2.5" style={{ maxHeight: 280 }}>
          <Tile
            label="Stretch"
            value={day.morning ? 'Morning flow' : 'Not planned'}
            sub={day.morning ? `${day.morning.items.length} moves · ${morningMinutes(day.morning)} min` : 'Add one to your plan'}
            status={day.morning ? tileState('morning') : '—'}
            icon={PersonStanding}
            tint={sky.dots[0]}
            disabled={!day.morning}
            ariaLabel="Start morning stretches"
            onClick={() => onOpen('morning')}
          />
          <Tile
            label="Workout"
            value={day.exercises.length ? day.title : 'Rest day'}
            sub={
              day.exercises.length
                ? `${day.exercises.length} ex · ${estimateWorkoutMinutes(day.exercises)} min`
                : day.notes[0] ?? 'Let your body recover'
            }
            status={day.exercises.length ? tileState('workout') : 'Rest'}
            icon={day.exercises.length ? Dumbbell : Moon}
            tint={sky.dots[1]}
            disabled={!day.exercises.length}
            ariaLabel={`Start ${day.title} workout`}
            onClick={() => onOpen('workout')}
          />
          <Tile
            label="Meditate"
            value="Breathe"
            sub="Breath · sleep · focus"
            status="Begin"
            icon={Flower2}
            tint={sky.dots[2]}
            ariaLabel="Meditate"
            onClick={() => onOpen('meditate')}
          />
          <Tile
            label="Alarms"
            value="Soon"
            sub="Sunrise wake-up"
            status="Soon"
            icon={AlarmClock}
            tint={sky.dots[1]}
            disabled
            ariaLabel="Alarms, coming soon"
            onClick={() => onOpen('alarms')}
          />
        </div>
      )}

      <Goals date={iso} dayKey={dayKey} />
      {plan && <WeekBar plan={plan} sessions={sessions} now={now} sky={sky} />}
    </div>
  );
}
