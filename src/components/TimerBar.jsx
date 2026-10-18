import { Minus, Pause, Play, Plus, SkipForward } from 'lucide-react';
import { useStore, timerLeft } from '../store';
import { useNow } from '../hooks/useNow';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function TimerBar({ now: nowProp }) {
  const ownNow = useNow(250);
  const now = nowProp ?? ownNow;
  const timer = useStore((s) => s.timer);
  const { adjustTimer, clearTimer, expireTimer, pauseTimer, resumeTimer } = useStore();
  if (!timer) return null;
  const remaining = timerLeft(timer, now);
  const paused = !!timer.pausedAt;
  const at = timer.pausedAt ?? now;
  const pct = timer.total ? (remaining / timer.total) * 100 : 0;

  return (
    <div className="sheet rounded-t-2xl px-4 pb-3 pt-2">
      <div className="mx-auto mb-2 h-1 w-10 rounded-full" style={{ background: 'rgb(var(--ink-rgb) / 0.2)' }} />
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-3">
            {timer.label}
            {paused && ' · Paused'}
            {timer.switchAt && (
              <span className="ml-1.5 font-semibold" style={{ color: 'var(--accent)' }}>
                · {at < timer.switchAt ? timer.sideLabels[0] : `Switch → ${timer.sideLabels[1]}`}
              </span>
            )}
          </p>
          <p className="text-2xl font-bold tabular-nums">{fmt(remaining)}</p>
        </div>
        {timer.complete && (
          <button onClick={paused ? resumeTimer : pauseTimer} aria-label={paused ? 'Resume' : 'Pause'} className="btn-ghost p-2.5">
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        )}
        <button onClick={() => adjustTimer(-15)} aria-label="15 seconds less" className="btn-ghost p-2.5">
          <Minus className="h-4 w-4" />
        </button>
        <button onClick={() => adjustTimer(15)} aria-label="15 seconds more" className="btn-ghost p-2.5">
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => (timer.complete ? expireTimer() : clearTimer())}
          aria-label="Skip"
          className="btn-primary p-2.5"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'rgb(var(--ink-rgb) / 0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
    </div>
  );
}
