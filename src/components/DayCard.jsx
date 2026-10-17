import { Check, Clock, Play } from 'lucide-react';

const STATUS_STYLE = {
  todo: null,
  progress: { label: 'In progress', color: 'var(--accent)' },
  done: { label: 'Done', color: 'var(--text-1)' },
  partial: { label: 'Ended early', color: '#fbbf24' },
};

export default function DayCard({ icon: Icon, accent, title, subtitle, detail, minutes, status, progressText, onClick }) {
  const done = status === 'done';
  const partial = status === 'partial';
  const s = STATUS_STYLE[status];
  return (
    <button
      onClick={onClick}
      className={`glass ${done ? 'glass-done' : partial ? 'glass-partial' : ''} w-full p-4 text-left transition active:scale-[0.99]`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: done ? 'rgb(var(--ink-rgb) / 0.12)' : partial ? 'rgba(251,191,36,0.15)' : 'rgb(var(--ink-rgb) / 0.07)',
            color: done ? 'var(--text-1)' : partial ? '#fbbf24' : accent,
          }}
        >
          {done || partial ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold">{title}</h3>
            <span className="pill shrink-0" style={{ background: 'rgb(var(--ink-rgb) / 0.08)', color: 'var(--text-2)' }}>
              <Clock className="h-3 w-3" />≈ {minutes} min
            </span>
          </div>
          <p className="mt-0.5 text-sm text-2">{subtitle}</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-3">{detail}</span>
            {s ? (
              <span className="shrink-0 whitespace-nowrap font-semibold" style={{ color: s.color }}>
                {s.label}
                {progressText ? ` · ${progressText}` : ''}
              </span>
            ) : (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-grad)', color: 'var(--on-accent)' }}
                aria-hidden="true"
              >
                <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
