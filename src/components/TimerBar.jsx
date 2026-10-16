import { Minus, Plus, SkipForward } from 'lucide-react';
import { useStore } from '../store';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function TimerBar({ now }) {
  const timer = useStore((s) => s.timer);
  const { adjustTimer, clearTimer, expireTimer } = useStore();
  if (!timer) return null;
  const remaining = Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
  const pct = timer.total ? (remaining / timer.total) * 100 : 0;

  return (
    <div className="sheet rounded-t-2xl px-4 pb-3 pt-2">
      <div className="mx-auto mb-2 h-1 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-3">
            {timer.label}
            {timer.switchAt && (
              <span className="ml-1.5 font-semibold" style={{ color: '#22d3ee' }}>
                · {now < timer.switchAt ? timer.sideLabels[0] : `Switch → ${timer.sideLabels[1]}`}
              </span>
            )}
          </p>
          <p className="text-2xl font-bold tabular-nums">{fmt(remaining)}</p>
        </div>
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
      <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#06b6d4)' }} />
      </div>
    </div>
  );
}
