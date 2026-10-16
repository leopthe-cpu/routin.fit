import { useMemo, useState } from 'react';
import { useKnownWeights } from '../hooks/useKnownWeights';
import { Minus, Plus, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { exerciseKey, isBodyweight, suggestWeight } from '../lib/weights';
import { displayWeight, formatWeight, JUMP, STEP, roundTo } from '../lib/units';
import { fromISODate } from '../lib/dates';

export default function WeightControl({ name, planWeight }) {
  const key = exerciseKey(name);
  const stored = useStore((s) => s.weights[key]);
  // A weight you saved wins; otherwise the plan's starting weight ("@ 31kg").
  const saved = stored ?? planWeight ?? null;
  const estimated = !stored && !!planWeight?.estimated;
  const unit = useStore((s) => s.settings.unit);
  const setWeight = useStore((s) => s.setWeight);
  const known = useKnownWeights();
  const [editing, setEditing] = useState(false);

  const current = displayWeight(saved, unit);
  const suggestion = useMemo(
    () => (saved ? null : suggestWeight(name, known, unit)),
    [saved, name, known, unit],
  );
  const bodyweight = !saved && isBodyweight(name);
  const [draft, setDraft] = useState('');

  const open = () => {
    setDraft(String(current ?? suggestion?.value ?? ''));
    setEditing(true);
  };
  const commit = (v) => {
    const n = Number(String(v).replace(',', '.'));
    if (Number.isFinite(n) && n > 0) setWeight(key, roundTo(n, STEP[unit]), unit);
    setEditing(false);
  };
  const nudge = (d) => {
    const base = Number(String(draft).replace(',', '.')) || 0;
    setDraft(String(Math.max(0, roundTo(base + d, STEP[unit]))));
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={() => nudge(-JUMP[unit])} aria-label="Lighter" className="btn-ghost p-1.5">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          autoFocus
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit(draft)}
          aria-label={`Weight in ${unit}`}
          className="w-16 rounded-lg bg-white/10 px-2 py-1 text-center text-sm font-semibold outline-none ring-1 ring-white/15 focus:ring-white/40"
        />
        <span className="text-xs text-2">{unit}</span>
        <button onClick={() => nudge(JUMP[unit])} aria-label="Heavier" className="btn-ghost p-1.5">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => commit(draft)} className="btn-primary px-3 py-1 text-xs">
          Save
        </button>
      </div>
    );
  }

  if (current != null && estimated) {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          onClick={open}
          className="pill"
          style={{ background: 'transparent', border: '1px dashed var(--text-3)', color: 'var(--accent)' }}
        >
          ≈ {formatWeight(current, unit)}
        </button>
        <span className="text-[11px] leading-tight text-3">Estimate: tap to set what you actually lift.</span>
      </div>
    );
  }

  if (current != null) {
    return (
      <button onClick={open} className="pill" style={{ background: 'rgb(var(--ink-rgb) / 0.07)', color: 'var(--accent)' }}>
        {formatWeight(current, unit)}
      </button>
    );
  }

  if (suggestion) {
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeight(key, suggestion.value, unit)}
            className="pill"
            style={{ background: 'transparent', border: '1px dashed var(--text-3)', color: 'var(--accent)' }}
          >
            <Sparkles className="h-3 w-3" /> Try {formatWeight(suggestion.value, unit)}
          </button>
          <button onClick={open} className="text-xs text-3 underline-offset-2 hover:underline">
            other
          </button>
        </div>
        <span className="text-[11px] leading-tight text-3">
          {suggestion.own
            ? `You did ${formatWeight(displayWeight(suggestion.basedOnWeight, unit), unit)} on ${fromISODate(suggestion.basedOnDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}; easing back in.`
            : `From your ${suggestion.basedOn} (${formatWeight(displayWeight(suggestion.basedOnWeight, unit), unit)}). Start light.`}
        </span>
      </div>
    );
  }

  return (
    <button onClick={open} className="pill" style={{ background: 'rgb(var(--ink-rgb) / 0.08)', color: 'var(--text-2)' }}>
      {bodyweight ? 'Bodyweight · add' : '+ Set weight'}
    </button>
  );
}
