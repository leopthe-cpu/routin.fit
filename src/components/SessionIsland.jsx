import { ChevronUp, Dumbbell, Sun } from 'lucide-react';
import { useStore, sessionProgress, timerLeft } from '../store';
import { clock } from '../lib/clock';

/**
 * A minimized session floating at the bottom of the app: what's running, the
 * rest or stretch timer (or time so far), and progress. Tap to go back in.
 */
export default function SessionIsland({ now, onOpen }) {
  const active = useStore((s) => (s.activeSessionKey ? s.sessions[s.activeSessionKey] : null));
  const timer = useStore((s) => s.timer);
  if (!active || active.endedAt) return null;

  const { done, total } = sessionProgress(active);
  const timed = timer?.sessionKey === active.key;
  const morning = active.kind === 'morning';
  const Icon = morning ? Sun : Dumbbell;
  const title = morning ? 'Stretches' : active.snapshot.title;
  const status = timed ? (timer.complete ? timer.label : 'Rest') : `${done} of ${total} ${morning ? 'moves' : 'sets'}`;
  const time = timed ? timerLeft(timer, now) : Math.floor((now - new Date(active.startedAt).getTime()) / 1000);

  return (
    <div className="px-3 pb-1">
      <button
        onClick={() => onOpen(active.kind, active.date)}
        aria-label={`Back to ${title}`}
        className="tile flex w-full flex-col gap-2 rounded-2xl px-4 pb-2.5 pt-3 text-left"
        style={{
          background: 'var(--sheet)',
          border: '1px solid var(--line)',
          boxShadow: '0 14px 30px -16px rgba(0,0,0,0.5)',
        }}
      >
        <span className="flex w-full items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'rgb(var(--ink-rgb) / 0.08)' }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-medium">{title}</span>
            <span className="label truncate text-[9px] text-2">
              {status}
              {timed && timer.pausedAt ? ' · paused' : ''}
            </span>
          </span>
          <span className="text-[24px] font-light tabular-nums">{clock(time)}</span>
          <ChevronUp className="h-4 w-4 shrink-0 text-3" />
        </span>
        <span className="block h-[3px] w-full overflow-hidden rounded-full" style={{ background: 'var(--track)' }}>
          <span
            className="block h-full rounded-full"
            style={{
              width: `${total ? (done / total) * 100 : 0}%`,
              background: 'var(--text-1)',
              transition: 'width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        </span>
      </button>
    </div>
  );
}
