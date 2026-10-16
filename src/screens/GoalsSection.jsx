import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { DAY_KEYS } from '../lib/parsePlan';

/** Simple recurring goals ("Run 5 km" on Mon, Wed, Fri) that show up on Today. */
export default function GoalsSection() {
  const goals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState(['Mon', 'Wed', 'Fri']);

  const save = () => {
    if (!title.trim() || !days.length) return;
    addGoal(title.trim(), DAY_KEYS.filter((d) => days.includes(d)));
    setTitle('');
    setAdding(false);
  };

  return (
    <section className="space-y-2">
      <h2 className="label text-2">Goals</h2>
      {goals.map((g) => (
        <div key={g.id} className="glass flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{g.title}</p>
            <p className="text-xs text-3">{g.days.length === 7 ? 'Every day' : g.days.join(' ')}</p>
          </div>
          <button
            onClick={() => confirm(`Delete the goal "${g.title}"?`) && deleteGoal(g.id)}
            aria-label={`Delete ${g.title}`}
            className="p-2 text-3"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="glass space-y-3 p-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Run 5 km"
            maxLength={60}
            className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40"
          />
          <div className="flex gap-1" role="group" aria-label="Days">
            {DAY_KEYS.map((d) => {
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  aria-pressed={on}
                  onClick={() => setDays((xs) => (on ? xs.filter((x) => x !== d) : [...xs, d]))}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold"
                  style={on ? { background: 'var(--accent-grad)', color: 'var(--on-accent)' } : { background: 'rgb(var(--ink-rgb) / 0.06)', color: 'var(--text-2)' }}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-ghost flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button onClick={save} disabled={!title.trim() || !days.length} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-40">
              Add goal
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] text-sm"
          style={{ border: '1px dashed var(--text-3)' }}
        >
          <Plus className="h-4 w-4" /> New goal
        </button>
      )}
    </section>
  );
}
