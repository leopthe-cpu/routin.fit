import { ArrowUpRight, Check, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, MapPin, Moon, Play, Sun } from 'lucide-react';
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
    <div className="mt-1 flex items-baseline gap-1.5">
      <span className="text-[52px] font-normal leading-none tracking-tight tabular-nums">{time}</span>
      {period && <span className="text-xl text-3">{period.toLowerCase()}</span>}
    </div>
  );
}

const STATUS_WORD = { todo: 'Start', progress: 'Resume', done: 'Done', partial: 'Ended' };

function Tile({ label, value, sub, status, icon, tint, onClick, ariaLabel, disabled }) {
  const done = status === 'Done';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="tile flex min-h-[104px] flex-col justify-between gap-2.5 rounded-[18px] px-3.5 py-3 text-left disabled:opacity-60"
      style={{
        background: `radial-gradient(120% 110% at 100% 0%, ${tint}3D 0%, ${tint}00 60%), var(--card-bg)`,
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <span className="flex w-full items-center justify-between">
        <span className="label text-2">{label}</span>
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: done ? 'rgba(34,197,94,0.2)' : 'rgb(var(--ink-rgb) / 0.07)' }}
        >
          {done ? (
            <Check className="h-3 w-3" strokeWidth={3} style={{ color: '#16a34a' }} />
          ) : disabled ? (
            <Moon className="h-3 w-3" />
          ) : icon === 'play' ? (
            <Play className="ml-px h-3 w-3" fill="currentColor" />
          ) : (
            <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
          )}
        </span>
      </span>
      <span className="flex w-full flex-col gap-0.5">
        <span className="text-[18px] leading-tight">{value}</span>
        <span className="flex items-baseline justify-between gap-1.5">
          <span className="truncate text-xs text-3">{sub}</span>
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
    <div className="mt-4 flex flex-col gap-2">
      <div className="label flex justify-between text-2">
        <span>This week</span>
        <span>
          {workouts + stretches} of {planned} sessions
        </span>
      </div>
      <div className="relative h-[54px] overflow-hidden rounded-[14px]" style={{ background: 'var(--track)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-[14px] transition-[width] duration-700"
          style={{ width: `${pct}%`, background: sky.bar }}
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl" style={{ color: pct > 12 ? '#16161a' : 'var(--text-1)' }}>
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
    <div className="mt-4 flex flex-col gap-2">
      <span className="label text-2">Goals today</span>
      {today.map((g) => {
        const on = !!checks[`${date}|${g.id}`];
        return (
          <button
            key={g.id}
            onClick={() => toggleGoal(date, g.id)}
            aria-pressed={on}
            className="tile flex min-h-[48px] items-center gap-3 rounded-[14px] px-3.5 text-left"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: on ? 'rgba(34,197,94,0.9)' : 'transparent', border: `1px solid ${on ? 'transparent' : 'var(--text-3)'}`, color: '#fff' }}
            >
              {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span className={on ? 'text-3 line-through' : ''}>{g.title}</span>
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
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
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
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Tile
            label="Stretch"
            value={day.morning ? 'Morning flow' : 'Not planned'}
            sub={day.morning ? `${day.morning.items.length} moves · ${morningMinutes(day.morning)} min` : 'Add one to your plan'}
            status={day.morning ? tileState('morning') : '—'}
            icon="play"
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
            icon="play"
            tint={sky.dots[1]}
            disabled={!day.exercises.length}
            ariaLabel={`Start ${day.title} workout`}
            onClick={() => onOpen('workout')}
          />
          <Tile
            label="Meditate"
            value="Soon"
            sub="Breath · sleep · focus"
            status="Preview"
            icon="arrow"
            tint={sky.dots[2]}
            ariaLabel="Preview meditation"
            onClick={() => onOpen('meditate')}
          />
          <Tile
            label="Alarms"
            value="Soon"
            sub="Sunrise wake-up"
            status="Preview"
            icon="arrow"
            tint={sky.dots[1]}
            ariaLabel="Preview alarms"
            onClick={() => onOpen('alarms')}
          />
        </div>
      )}

      <Goals date={iso} dayKey={dayKey} />
      {plan && <WeekBar plan={plan} sessions={sessions} now={now} sky={sky} />}
    </div>
  );
}
