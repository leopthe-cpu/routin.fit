// Small building blocks for the views laid over the full-screen sky.

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTween } from '../../hooks/useTween';
import { clock } from '../../lib/clock';

export function GlassButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`sky-glass flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[15px] disabled:opacity-40 ${className}`}
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

export function Bar({ fraction, smooth = '250ms linear' }) {
  return (
    <span className="relative block h-[3px] overflow-hidden rounded-full" style={{ background: 'var(--track)' }}>
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${Math.min(1, Math.max(0, fraction)) * 100}%`,
          background: 'currentColor',
          transition: `width ${smooth}`,
        }}
      />
    </span>
  );
}

// Informational chips are monochrome on purpose: three neutral looks tell
// kinds of information apart without warning-like colours.
const CHIP_TONES = {
  solid: { background: 'rgb(var(--ink-rgb) / 0.16)', border: '1px solid transparent' },
  soft: { background: 'rgb(var(--ink-rgb) / 0.07)', border: '1px solid transparent' },
  line: { background: 'transparent', border: '1px solid rgb(var(--ink-rgb) / 0.3)' },
};

export function Chip({ icon: Icon, tone = 'soft', active = false, onClick, children }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={
        onClick &&
        ((e) => {
          e.stopPropagation();
          onClick();
        })
      }
      aria-pressed={onClick ? active : undefined}
      className="inline-flex min-h-[32px] max-w-full items-center gap-1.5 rounded-full px-3 text-[13px] leading-tight"
      style={{ ...CHIP_TONES[tone], boxShadow: active ? 'inset 0 0 0 1.5px currentColor' : 'none' }}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
      <span className="truncate">{children}</span>
    </Tag>
  );
}

/**
 * A glass card that turns over when `face` changes: it rotates edge-on, swaps
 * its content, and rotates back. (A true 3D flip would break the frosted
 * backdrop in some browsers.)
 */
export function FlipCard({ face, render, className = '' }) {
  const [shown, setShown] = useState(face);
  const [turning, setTurning] = useState(false);
  useEffect(() => {
    if (face === shown) return undefined;
    setTurning(true);
    const id = setTimeout(() => {
      setShown(face);
      setTurning(false);
    }, 180);
    return () => clearTimeout(id);
  }, [face, shown]);

  return (
    <div
      className={`sky-glass flex flex-col gap-3 rounded-[26px] p-5 text-left ${className}`}
      style={{
        // Only transformed mid-turn: a resting 3D transform would switch off the frosted blur.
        transform: turning ? 'perspective(1200px) rotateY(90deg)' : 'none',
        transition: 'transform 180ms ease-in-out',
      }}
    >
      {render(shown)}
    </div>
  );
}

/**
 * Above the card: a start phrase before anything is done, then the session's
 * progress as a big percentage with the elapsed time over it and a bar that
 * glides from left to right.
 */
export function FocusHeader({ phrase, fraction, elapsed }) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 1000) / 10;
  const shown = useTween(pct);
  if (phrase) {
    return <p className="max-w-[330px] px-1 text-[30px] font-light leading-[1.15] tracking-tight">{phrase}</p>;
  }
  return (
    <div className="flex w-full flex-col px-1">
      {elapsed != null && (
        <span className="text-[28px] font-light leading-none tabular-nums opacity-80">{clock(elapsed)}</span>
      )}
      <span className="mt-1 text-[80px] font-light leading-[0.95] tracking-tighter tabular-nums">
        {Math.round(shown)}
        <span className="text-[30px] opacity-70">%</span>
      </span>
      <span className="mt-3 block h-1 overflow-hidden rounded-full" style={{ background: 'var(--track)' }}>
        <span
          className="block h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'currentColor',
            transition: 'width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
      </span>
    </div>
  );
}

/** Under the card: where you are, with arrows hinting that the card swipes. */
export function SwipeHint({ canPrev, canNext, children }) {
  return (
    <div className="label flex items-center justify-center gap-3 text-[10px] opacity-70" aria-hidden="true">
      <ChevronLeft className="h-3.5 w-3.5" style={{ opacity: canPrev ? 1 : 0.25 }} />
      <span>{children}</span>
      <ChevronRight className="h-3.5 w-3.5" style={{ opacity: canNext ? 1 : 0.25 }} />
    </div>
  );
}
