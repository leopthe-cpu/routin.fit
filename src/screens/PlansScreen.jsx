import { useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useStore, makePlan } from '../store';
import { parsePlanText, looksUnparsed, DAY_KEYS } from '../lib/parsePlan';
import { normaliseWithAI } from '../lib/aiImport';
import { estimateWorkoutMinutes } from '../lib/estimate';

const EXAMPLE = `Mon: Chest & Biceps
* Morning Routine (5 min): cat-cow stretch, wrist circles, shoulder pass-throughs
* Incline Dumbbell Bench Press: 3x6-8
* Hammer Curls + Kickbacks (Superset): 3x10-12 each

Tue: Rest Day
REST DAY
* Light 20-30 min walk`;

function PlanEditor({ initial, onCancel, onSave }) {
  const settings = useStore((s) => s.settings);
  const [name, setName] = useState(initial?.name ?? '');
  const [text, setText] = useState(initial?.sourceText ?? '');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const parsed = useMemo(() => parsePlanText(text), [text]);
  const weak = text.trim() && looksUnparsed(parsed);

  const runAI = async () => {
    setAiBusy(true);
    setAiError('');
    try {
      setText(await normaliseWithAI(text, { apiKey: settings.openrouterKey, model: settings.openrouterModel }));
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="glass space-y-3 p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Plan name"
        className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EXAMPLE}
        rows={12}
        className="w-full rounded-xl bg-white/5 px-3 py-2.5 font-mono text-xs leading-relaxed outline-none ring-1 ring-white/10 focus:ring-white/40"
      />

      {text.trim() && (
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-2">Preview</p>
          {DAY_KEYS.map((k) => {
            const d = parsed.days[k];
            return (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-2">
                  <span className="inline-block w-9 font-semibold text-white">{k}</span>
                  {d.exercises.length ? d.title || 'Workout' : 'Rest'}
                </span>
                <span className="shrink-0 text-3">
                  {d.morning ? 'stretches · ' : ''}
                  {d.exercises.length ? `${d.exercises.length} ex · ≈${estimateWorkoutMinutes(d.exercises)} min` : '—'}
                </span>
              </div>
            );
          })}
          {parsed.warnings.length > 0 && (
            <p className="pt-1 text-amber-300/80">Ignored {parsed.warnings.length} line(s) before the first day heading.</p>
          )}
        </div>
      )}

      {(weak || aiError) && (
        <div className="rounded-xl p-3 text-xs" style={{ background: 'rgb(var(--ink-rgb) / 0.04)', border: '1px solid var(--line)' }}>
          {weak && <p className="text-2">Couldn't find days and exercises in this text. Let AI restructure it?</p>}
          {aiError && <p className="mt-1 text-red-300">{aiError}</p>}
          <button onClick={runAI} disabled={aiBusy} className="btn-ghost mt-2 flex items-center gap-2 px-3 py-1.5">
            {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Structure with AI
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1 py-2.5 text-sm">
          Cancel
        </button>
        <button
          disabled={!name.trim() || !text.trim() || weak}
          onClick={() => onSave(name.trim(), text)}
          className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-40"
        >
          Save plan
        </button>
      </div>
    </div>
  );
}

export default function PlansScreen() {
  const { plans, activePlanId, settings, addPlan, updatePlan, deletePlan, setActivePlan, setSettings } = useStore();
  const [editing, setEditing] = useState(null); // null | 'new' | plan id

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="text-sm text-2">Paste a plan as text. Days start with "Mon:", exercises look like "Name: 3x8-10".</p>
      </header>

      <div className="glass flex items-center justify-between p-4">
        <div>
          <p className="font-semibold">Weight unit</p>
          <p className="text-xs text-3">Saved weights convert automatically.</p>
        </div>
        <div className="flex rounded-xl p-1" style={{ background: 'rgb(var(--ink-rgb) / 0.06)' }} role="radiogroup" aria-label="Weight unit">
          {['kg', 'lb'].map((u) => (
            <button
              key={u}
              role="radio"
              aria-checked={settings.unit === u}
              onClick={() => setSettings({ unit: u })}
              className="rounded-lg px-4 py-1.5 text-sm font-semibold"
              style={settings.unit === u ? { background: 'var(--accent-grad)', color: 'var(--on-accent)' } : { color: 'var(--text-2)' }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {plans.map((p) =>
          editing === p.id ? (
            <PlanEditor
              key={p.id}
              initial={p}
              onCancel={() => setEditing(null)}
              onSave={(name, text) => {
                updatePlan(p.id, { name, sourceText: text, days: parsePlanText(text).days });
                setEditing(null);
              }}
            />
          ) : (
            <div key={p.id} className="glass flex items-center gap-3 p-4">
              <button
                onClick={() => setActivePlan(p.id)}
                aria-label={`Use ${p.name}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: p.id === activePlanId ? 'var(--accent-grad)' : 'transparent',
                  color: 'var(--on-accent)',
                  border: '1px solid rgb(var(--ink-rgb) / 0.25)',
                }}
              >
                {p.id === activePlanId && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.name}</p>
                <label className="mt-0.5 flex items-center gap-2 text-xs text-3">
                  Started
                  <input
                    type="date"
                    value={p.startDate}
                    onChange={(e) => e.target.value && updatePlan(p.id, { startDate: e.target.value })}
                    className="rounded bg-transparent text-xs text-2 outline-none"
                  />
                </label>
              </div>
              <button onClick={() => setEditing(p.id)} aria-label={`Edit ${p.name}`} className="p-1 text-3">
                <Pencil className="h-4 w-4" />
              </button>
              {plans.length > 1 && (
                <button
                  onClick={() => confirm(`Delete "${p.name}"?`) && deletePlan(p.id)}
                  aria-label={`Delete ${p.name}`}
                  className="p-1 text-3"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        )}
      </div>

      {editing === 'new' ? (
        <PlanEditor
          onCancel={() => setEditing(null)}
          onSave={(name, text) => {
            addPlan(makePlan(name, text));
            setEditing(null);
          }}
        />
      ) : (
        <button onClick={() => setEditing('new')} className="btn-ghost flex w-full items-center justify-center gap-2 py-3 text-sm">
          <Plus className="h-4 w-4" /> New plan from text
        </button>
      )}

    </div>
  );
}
