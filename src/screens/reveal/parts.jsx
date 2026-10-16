// Small building blocks for the views laid over the full-screen sky.

export function GlassButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`sky-glass flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[15px] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GlassCard({ as: Tag = 'div', children, className = '', ...props }) {
  return (
    <Tag {...props} className={`sky-glass flex flex-col rounded-[26px] p-5 text-left ${className}`}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children }) {
  return <span className="label opacity-80">{children}</span>;
}

export function Bar({ fraction }) {
  return (
    <span className="relative block h-[3px] overflow-hidden rounded-full" style={{ background: 'var(--track)' }}>
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`, background: 'currentColor', transition: 'width 250ms linear' }}
      />
    </span>
  );
}

export const clock = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
