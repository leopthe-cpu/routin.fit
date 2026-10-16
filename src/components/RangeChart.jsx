import { useState } from 'react';
import { convert, formatWeight, roundTo } from '../lib/units';
import { fromISODate } from '../lib/dates';

const W = 340;
const H = 170;
const PAD = { top: 12, right: 8, bottom: 26, left: 34 };
const MAX_POINTS = 16;

const shortDate = (iso) => fromISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function niceTicks(lo, hi, count = 3) {
  const span = Math.max(hi - lo, 1);
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const start = Math.floor(lo / step) * step;
  const ticks = [];
  for (let v = start; v <= hi + step * 0.5; v += step) ticks.push(roundTo(v, step / 10));
  return ticks;
}

/**
 * One rounded bar per session from the lightest to the heaviest set; the latest
 * session is drawn in the accent. Tap or hover a bar to read its sets.
 */
export default function RangeChart({ points, unit, label }) {
  const shown = points.slice(-MAX_POINTS).map((p) => ({
    ...p,
    lo: convert(p.min, 'kg', unit),
    hi: convert(p.max, 'kg', unit),
  }));
  const [active, setActive] = useState(shown.length - 1);
  if (!shown.length) return null;

  const lo = Math.min(...shown.map((p) => p.lo));
  const hi = Math.max(...shown.map((p) => p.hi));
  const ticks = niceTicks(lo, hi);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1] === yMin ? yMin + 1 : ticks[ticks.length - 1];
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(shown.length, 1);
  const barW = Math.min(10, slot * 0.5);
  const x = (i) => PAD.left + slot * (i + 0.5);
  const y = (v) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const labelIdx = [...new Set([0, Math.floor((shown.length - 1) / 2), shown.length - 1])];

  const sel = shown[Math.min(active, shown.length - 1)];
  const sets = sel.kg.map((k) => roundTo(convert(k, 'kg', unit), unit === 'kg' ? 0.5 : 1));

  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round((px - PAD.left) / slot - 0.5);
    setActive(Math.max(0, Math.min(shown.length - 1, i)));
  };

  return (
    <figure className="m-0">
      <p className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-2">{shortDate(sel.date)}</span>
        <span className="tabular-nums text-white">{sets.map((v) => formatWeight(v, '').trim()).join(' · ')} {unit}</span>
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`${label}: ${shown.length} sessions from ${shortDate(shown[0].date)} to ${shortDate(sel.date)}, heaviest ${formatWeight(roundTo(hi, 0.5), unit)}`}
        onPointerMove={pick}
        onPointerDown={pick}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="rgb(var(--ink-rgb) / 0.06)" />
            <text x={PAD.left - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="rgb(var(--ink-rgb) / 0.35)">
              {t}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="rgb(var(--ink-rgb) / 0.18)" />
        {shown.map((p, i) => {
          const latest = i === shown.length - 1;
          const isActive = i === active;
          return (
            <g key={p.date}>
              <line x1={x(i)} x2={x(i)} y1={H - PAD.bottom} y2={H - PAD.bottom + 4} stroke="rgb(var(--ink-rgb) / 0.18)" />
              <line
                x1={x(i)}
                x2={x(i)}
                y1={y(p.hi)}
                y2={y(p.lo)}
                stroke={latest ? 'var(--accent)' : isActive ? 'rgb(var(--ink-rgb) / 0.95)' : 'rgb(var(--ink-rgb) / 0.55)'}
                strokeWidth={barW}
                strokeLinecap="round"
              />
            </g>
          );
        })}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 && shown.length > 1 ? 'start' : i === shown.length - 1 && shown.length > 1 ? 'end' : 'middle'}
            fontSize="10"
            fill="rgb(var(--ink-rgb) / 0.45)"
          >
            {shortDate(shown[i].date).toUpperCase()}
          </text>
        ))}
      </svg>
    </figure>
  );
}
