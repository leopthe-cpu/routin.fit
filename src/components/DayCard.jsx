import { Check, ChevronRight, Clock } from 'lucide-react';

const STATUS_STYLE = {
  todo: null,
  progress: { label: 'In progress', color: '#22d3ee' },
  done: { label: 'Done', color: '#4ade80' },
};

export default function DayCard({ icon: Icon, accent, title, subtitle, detail, minutes, status, progressText, onClick }) {
  const done = status === 'done';
  const s = STATUS_STYLE[status];
  return (
    <button
      onClick={onClick}
      className={`glass ${done ? 'glass-done' : ''} w-full p-4 text-left transition active:scale-[0.99]`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: done ? 'rgba(34,197,94,0.18)' : `${accent}22`,
            color: done ? '#4ade80' : accent,
          }}
        >
          {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold">{title}</h3>
            <span className="pill shrink-0" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-2)' }}>
              <Clock className="h-3 w-3" />≈ {minutes} min
            </span>
          </div>
          <p className="mt-0.5 text-sm text-2">{subtitle}</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-3">{detail}</span>
            {s ? (
              <span className="font-semibold" style={{ color: s.color }}>
                {s.label}
                {progressText ? ` · ${progressText}` : ''}
              </span>
            ) : (
              <ChevronRight className="h-4 w-4 text-3" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
