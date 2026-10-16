import { Check, Minus, Plus, RotateCcw, SkipForward } from 'lucide-react';
import { useStore, sessionKey, sessionProgress, timerLeft } from '../../store';
import { dayKeyOf, fromISODate } from '../../lib/dates';
import { nextSet } from '../../lib/flow';
import { exerciseKey, isBodyweight } from '../../lib/weights';
import { displayWeight, formatWeight, roundTo, STEP } from '../../lib/units';
import { Bar, Eyebrow, GlassButton, GlassCard, clock } from './parts';

/** A short coaching line from the rep target (heavy, moderate, light, hold, to failure). */
function tipFor(ex) {
  const t = ex.target;
  if (t.kind === 'hold') return 'Hold still, brace, and keep breathing.';
  if (t.kind === 'failure') return 'Go until your form starts to slip, then stop.';
  const low = t.min ?? 10;
  if (low <= 8) return 'Heavy set: brace, lower for 2–3 seconds, stop with 1–2 reps left.';
  if (low <= 10) return 'Control the lowering, pause briefly, then drive up.';
  return 'Smooth, steady reps. Feel the muscle work the whole way.';
}

function BigWeight({ ex }) {
  const wkey = exerciseKey(ex.name);
  const stored = useStore((s) => s.weights[wkey]);
  const unit = useStore((s) => s.settings.unit);
  const setWeight = useStore((s) => s.setWeight);
  const saved = stored ?? ex.startWeight ?? null;
  const shown = displayWeight(saved, unit);

  if (!saved && isBodyweight(ex.name)) {
    return <p className="py-3 text-center text-[40px] font-light">Bodyweight</p>;
  }
  const step = unit === 'kg' ? 1 : 2.5;
  const nudge = (d) => setWeight(wkey, Math.max(0, roundTo((shown ?? 0) + d, STEP[unit])), unit);
  const round = 'sky-glass flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full';
  return (
    <div className="flex items-center justify-between py-1">
      <button onClick={() => nudge(-step)} aria-label="Lighter" className={round}>
        <Minus className="h-5 w-5" />
      </button>
      <span className="flex flex-col items-center">
        <span className="text-[68px] font-light leading-none tracking-tighter tabular-nums">
          {shown == null ? '—' : formatWeight(shown, '').trim()}
          <span className="text-xl opacity-70"> {unit}</span>
        </span>
        {!stored && ex.startWeight?.estimated && <span className="label text-[9px] opacity-70">Estimate · adjust me</span>}
      </span>
      <button onClick={() => nudge(step)} aria-label="Heavier" className={round}>
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

/** One exercise at a time: weight, Done set, then a rest screen until the next set. */
export default function WorkoutFocus({ date, now }) {
  const plan = useStore((s) => s.activePlan());
  const key = sessionKey(date, 'workout');
  const session = useStore((s) => s.sessions[key]);
  const timer = useStore((s) => s.timer);
  const { startSession, toggleSet, finishSession, reopenSession, adjustTimer, clearTimer } = useStore();
  const day = plan?.days[dayKeyOf(fromISODate(date))];
  const content = session?.snapshot ?? (day?.exercises.length ? { title: day.title, exercises: day.exercises } : null);

  if (!content) {
    return (
      <GlassCard className="mt-auto gap-2">
        <Eyebrow>Workout</Eyebrow>
        <p className="text-2xl">Rest day. Let your body recover.</p>
      </GlassCard>
    );
  }

  const { done, total } = sessionProgress(session);
  const exercises = content.exercises;
  const next = nextSet(exercises, session?.done);
  const elapsed = session && !session.endedAt ? Math.floor((now - new Date(session.startedAt).getTime()) / 1000) : null;

  if (session?.endedAt) {
    return (
      <GlassCard className="mt-auto gap-3">
        <Eyebrow>
          {content.title} · {done} of {total} sets
        </Eyebrow>
        <p className="text-[32px] font-light leading-tight">{done >= total ? 'Workout done. Strong work.' : 'Ended early.'}</p>
        <GlassButton className="self-start" onClick={() => reopenSession(key)}>
          <RotateCcw className="h-4 w-4" /> Reopen
        </GlassButton>
      </GlassCard>
    );
  }

  if (!next) {
    return (
      <GlassCard className="mt-auto gap-4">
        <Eyebrow>
          {content.title} · {total} of {total} sets{elapsed != null && ` · ${clock(elapsed)}`}
        </Eyebrow>
        <p className="text-[32px] font-light leading-tight">Every set done.</p>
        <button
          onClick={() => finishSession(key)}
          className="h-[60px] rounded-[18px] text-lg font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          Finish workout
        </button>
      </GlassCard>
    );
  }

  const resting = timer?.sessionKey === key && !timer.complete;
  const { ex, setIndex, index } = next;

  if (resting) {
    const left = timerLeft(timer, now);
    return (
      <div className="mt-auto flex flex-col gap-3">
        <GlassCard className="gap-3">
          <Eyebrow>
            Rest · {done} of {total} sets{elapsed != null && ` · ${clock(elapsed)}`}
          </Eyebrow>
          <span className="text-[92px] font-light leading-[0.95] tracking-tighter tabular-nums">{clock(left)}</span>
          <Bar fraction={timer.total ? 1 - left / timer.total : 0} />
          <span className="text-lg leading-snug opacity-90">
            Up next: {ex.name} · set {setIndex + 1} of {ex.sets}
          </span>
        </GlassCard>
        <div className="flex justify-end gap-2">
          <GlassButton onClick={() => adjustTimer(-15)} aria-label="15 seconds less">
            <Minus className="h-4 w-4" /> 15 s
          </GlassButton>
          <GlassButton onClick={() => adjustTimer(15)} aria-label="15 seconds more">
            <Plus className="h-4 w-4" /> 15 s
          </GlassButton>
          <GlassButton onClick={clearTimer}>
            Skip <SkipForward className="h-4 w-4" />
          </GlassButton>
        </div>
      </div>
    );
  }

  const doneSet = () => {
    if (!session) startSession({ date, kind: 'workout', day, planId: plan.id });
    toggleSet(key, ex.id, setIndex);
  };

  return (
    <div className="mt-auto flex flex-col gap-3">
      <GlassCard className="gap-3">
        <Eyebrow>
          Workout · {index + 1} of {exercises.length} · Set {setIndex + 1} of {ex.sets}
          {elapsed != null && ` · ${clock(elapsed)}`}
        </Eyebrow>
        <span className="text-[30px] font-medium leading-[1.08]">{ex.name}</span>
        <span className="text-[15px] leading-snug opacity-85">
          {ex.sets} sets × {ex.target.label}
          {ex.supersetGroup ? ` · superset ${ex.supersetGroup}` : ''}
          {ex.note ? ` · ${ex.note}` : ''}
          <br />
          {tipFor(ex)}
        </span>
        <BigWeight ex={ex} />
        <button
          onClick={doneSet}
          className="flex h-[60px] items-center justify-center gap-2 rounded-[18px] text-lg font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <Check className="h-5 w-5" strokeWidth={3} /> Done set
        </button>
      </GlassCard>
      {session && (
        <div className="flex justify-end">
          <GlassButton onClick={() => confirm('End this workout now? Your ticked sets are kept.') && finishSession(key)}>
            End early
          </GlassButton>
        </div>
      )}
    </div>
  );
}
