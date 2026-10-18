import { ChevronUp, Dumbbell, Flower2, Sun } from 'lucide-react';
import { useStore, sessionProgress, timerLeft, meditationActive, meditationProgress } from '../store';
import { clock } from '../lib/clock';
import { useNow } from '../hooks/useNow';

function Island({ icon: Icon, title, status, time, fraction, label, onClick }) {
  return (
    <div className="px-3 pb-1">
      <button
        onClick={onClick}
        aria-label={label}
        className="tile flex w-full flex-col gap-2 rounded-2xl px-4 pb-2.5 pt-3 text-left"
        // Inverted colours so it stands out from the panel in both themes.
        style={{
          background: 'rgb(var(--ink-rgb))',
          color: 'var(--bg)',
          boxShadow: '0 16px 34px -14px rgba(0,0,0,0.55)',
        }}
      >
        <span className="flex w-full items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--bg) 16%, transparent)' }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-medium">{title}</span>
            <span className="label truncate text-[9px] opacity-70">{status}</span>
          </span>
          <span className="text-[24px] font-light tabular-nums">{clock(time)}</span>
          <ChevronUp className="h-4 w-4 shrink-0 opacity-60" />
        </span>
        <span
          className="block h-[3px] w-full overflow-hidden rounded-full"
          style={{ background: 'color-mix(in srgb, var(--bg) 22%, transparent)' }}
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.min(1, fraction) * 100}%`,
              background: 'var(--bg)',
              transition: 'width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        </span>
      </button>
    </div>
  );
}

/**
 * Whatever is running while minimized, floating at the bottom of the app: a
 * workout or stretch (rest or move timer, else time so far, plus progress) or
 * a meditation (time left). Tap to go back in.
 */
export default function SessionIsland({ onOpen }) {
  const now = useNow(500);
  const active = useStore((s) => (s.activeSessionKey ? s.sessions[s.activeSessionKey] : null));
  const timer = useStore((s) => s.timer);
  const meditation = useStore((s) => s.meditation);

  if (active && !active.endedAt) {
    const { done, total } = sessionProgress(active);
    const timed = timer?.sessionKey === active.key;
    const morning = active.kind === 'morning';
    const title = morning ? 'Stretches' : active.snapshot.title;
    const status = timed ? (timer.complete ? timer.label : 'Rest') : `${done} of ${total} ${morning ? 'moves' : 'sets'}`;
    return (
      <Island
        icon={morning ? Sun : Dumbbell}
        title={title}
        status={`${status}${timed && timer.pausedAt ? ' · paused' : ''}`}
        time={timed ? timerLeft(timer, now) : Math.floor((now - new Date(active.startedAt).getTime()) / 1000)}
        fraction={total ? done / total : 0}
        label={`Back to ${title}`}
        onClick={() => onOpen(active.kind, active.date)}
      />
    );
  }
  if (meditationActive(meditation)) {
    const { length, elapsed, left } = meditationProgress(meditation, now);
    return (
      <Island
        icon={Flower2}
        title={`Meditation · ${meditation.type}`}
        status={meditation.pausedAt ? 'Paused' : `${meditation.minutes} min`}
        time={Math.ceil(left)}
        fraction={length ? elapsed / length : 0}
        label="Back to meditation"
        onClick={() => onOpen('meditate')}
      />
    );
  }
  return null;
}
