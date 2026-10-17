import { useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Lightbulb,
  Link2,
  Minus,
  PersonStanding,
  Plus,
  Repeat,
  RotateCcw,
  SkipForward,
  StickyNote,
  Timer,
} from 'lucide-react';
import { useStore, sessionKey, sessionProgress, timerLeft } from '../../store';
import { dayKeyOf, fromISODate } from '../../lib/dates';
import { restSecondsFor } from '../../lib/estimate';
import { setSequence, startPhrase, tipFor } from '../../lib/flow';
import { exerciseKey, isBodyweight } from '../../lib/weights';
import { displayWeight, formatWeight, roundTo, STEP } from '../../lib/units';
import { formLinks } from '../../lib/youtube';
import { clock } from '../../lib/clock';
import { useSwipe } from '../../hooks/useSwipe';
import { Bar, Chip, FlipCard, FocusHeader, GlassButton, GlassCard, StepNav } from './parts';

function BigWeight({ ex }) {
  const wkey = exerciseKey(ex.name);
  const stored = useStore((s) => s.weights[wkey]);
  const unit = useStore((s) => s.settings.unit);
  const setWeight = useStore((s) => s.setWeight);
  const saved = stored ?? ex.startWeight ?? null;
  const shown = displayWeight(saved, unit);

  if (!saved && isBodyweight(ex.name)) {
    return <p className="py-2 text-center text-[36px] font-light">Bodyweight</p>;
  }
  const step = unit === 'kg' ? 1 : 2.5;
  const nudge = (d) => setWeight(wkey, Math.max(0, roundTo((shown ?? 0) + d, STEP[unit])), unit);
  const round = 'sky-glass flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full';
  return (
    <div className="flex items-center justify-between">
      <button onClick={() => nudge(-step)} aria-label="Lighter" className={round}>
        <Minus className="h-5 w-5" />
      </button>
      <span className="flex flex-col items-center">
        <span className="text-[64px] font-light leading-none tracking-tighter tabular-nums">
          {shown == null ? '—' : formatWeight(shown, '').trim()}
          <span className="text-xl opacity-70"> {unit}</span>
        </span>
        {!stored && ex.startWeight?.estimated && (
          <span className="label text-[9px] opacity-70">Estimate · adjust me</span>
        )}
      </span>
      <button onClick={() => nudge(step)} aria-label="Heavier" className={round}>
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

/** What the back of the card says for each chip. */
function backText(face, ex, exercises) {
  const rest = restSecondsFor(ex);
  switch (face) {
    case 'target':
      return {
        title: `${ex.sets} sets × ${ex.target.label}`,
        body:
          ex.target.kind === 'hold'
            ? 'Hold each set for the time shown. Stop early if your form breaks.'
            : 'Pick a weight where the last rep of each set is hard but still clean.',
      };
    case 'superset': {
      const partners = exercises.filter((e) => e.supersetGroup === ex.supersetGroup).map((e) => e.name);
      return {
        title: `Superset ${ex.supersetGroup}`,
        body: `${partners.join(' + ')}. Do one set of each back to back, then rest ${rest} s before the next round.`,
      };
    }
    case 'rest':
      return {
        title: `Rest ${rest} s`,
        body: 'The rest timer starts when you tap Next set. Heavier, lower-rep sets get longer rest so you have strength for the next one.',
      };
    case 'tip':
      return { title: tipFor(ex).short, body: tipFor(ex).long };
    case 'note':
      return { title: 'Note', body: ex.note };
    default:
      return { title: 'Form', body: 'A short form animation is coming. Until then, watch a demo:' };
  }
}

function SetCard({ step, exercises, done, face, setFace, nextLabel, onNext, onUndo }) {
  const { ex, setIndex } = step;
  const toggle = (k) => setFace(face === k ? 'front' : k);
  const tip = tipFor(ex);
  const chips = (
    <div className="flex flex-wrap gap-1.5">
      <Chip icon={Repeat} tone="solid" active={face === 'target'} onClick={() => toggle('target')}>
        {ex.sets} × {ex.target.label}
      </Chip>
      {ex.supersetGroup && (
        <Chip icon={Link2} tone="line" active={face === 'superset'} onClick={() => toggle('superset')}>
          Superset {ex.supersetGroup}
        </Chip>
      )}
      <Chip icon={Timer} tone="soft" active={face === 'rest'} onClick={() => toggle('rest')}>
        Rest {restSecondsFor(ex)} s
      </Chip>
      <Chip icon={Lightbulb} tone="line" active={face === 'tip'} onClick={() => toggle('tip')}>
        {tip.short}
      </Chip>
      {ex.note && (
        <Chip icon={StickyNote} tone="soft" active={face === 'note'} onClick={() => toggle('note')}>
          Note
        </Chip>
      )}
      <Chip icon={PersonStanding} tone="soft" active={face === 'form'} onClick={() => toggle('form')}>
        Form
      </Chip>
    </div>
  );

  return (
    <FlipCard
      face={face}
      render={(f) => (
        <>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[28px] font-medium leading-[1.08]">{ex.name}</h2>
            <span
              className="shrink-0 rounded-full px-3 py-0.5 text-[24px] font-light tabular-nums"
              style={{ background: 'rgb(var(--ink-rgb) / 0.12)' }}
              aria-label={`Set ${setIndex + 1} of ${ex.sets}`}
            >
              {done ? <Check className="my-1.5 h-5 w-5" strokeWidth={2.5} /> : `${setIndex + 1}/${ex.sets}`}
            </span>
          </div>
          {chips}
          {f === 'front' ? (
            <>
              <BigWeight ex={ex} />
              {done ? (
                <button
                  onClick={onUndo}
                  className="sky-glass flex h-[60px] items-center justify-center gap-2 rounded-[18px] text-lg font-semibold"
                >
                  <RotateCcw className="h-5 w-5" /> Undo this set
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="flex h-[60px] items-center justify-center gap-2 rounded-[18px] text-lg font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                >
                  <span className="truncate px-3">{nextLabel}</span>
                </button>
              )}
            </>
          ) : (
            <Back face={f} ex={ex} exercises={exercises} onBack={() => setFace('front')} />
          )}
        </>
      )}
    />
  );
}

function Back({ face, ex, exercises, onBack }) {
  const { title, body } = backText(face, ex, exercises);
  return (
    <button onClick={onBack} className="flex min-h-[176px] flex-col gap-2 text-left" aria-label="Back to the set">
      <span className="text-xl font-medium">{title}</span>
      <span className="text-[16px] leading-snug opacity-90">{body}</span>
      {face === 'form' && (
        <span className="mt-1 flex flex-col gap-1.5">
          {formLinks(ex.name).map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 underline underline-offset-4"
            >
              <ExternalLink className="h-4 w-4" /> {l.label} on YouTube
            </a>
          ))}
        </span>
      )}
      <span className="label mt-auto pt-2 text-[10px] opacity-70">Tap to turn back</span>
    </button>
  );
}

/** The set to do now: the first open set of a picked exercise, else the first open set in order. */
function currentIndex(seq, isDone, focusExId) {
  if (focusExId) {
    const picked = seq.findIndex((st) => st.ex.id === focusExId && !isDone(st));
    if (picked >= 0) return picked;
  }
  return seq.findIndex((st) => !isDone(st));
}

/**
 * One set at a time. Next set ticks the set and starts the rest timer; the
 * last set of an exercise names the one that follows. Back walks through the
 * sets already done (never the rests between them) so any of them can be
 * undone. Picking an exercise in the list jumps to it; afterwards the order
 * picks up where it left off.
 */
export default function WorkoutFocus({ date, now, focusExId }) {
  const plan = useStore((s) => s.activePlan());
  const key = sessionKey(date, 'workout');
  const session = useStore((s) => s.sessions[key]);
  const timer = useStore((s) => s.timer);
  const { startSession, toggleSet, finishSession, reopenSession, discardSession, adjustTimer, clearTimer } = useStore();
  const day = plan?.days[dayKeyOf(fromISODate(date))];
  const content = session?.snapshot ?? (day?.exercises.length ? { title: day.title, exercises: day.exercises } : null);
  const exercises = content?.exercises;
  const seq = useMemo(() => (exercises ? setSequence(exercises) : []), [exercises]);

  const [back, setBack] = useState(0); // how many done sets back from "now" we're looking
  const [dir, setDir] = useState('next');
  const [face, setFace] = useState('front');
  const [stamp, setStamp] = useState(null);
  const [lastDone, setLastDone] = useState(null); // seq index of the set just ticked

  const isDone = (st) => !!session?.done[st.ex.id]?.includes(st.setIndex);
  const currentPos = currentIndex(seq, isDone, focusExId);
  const allDone = seq.length > 0 && currentPos === -1;
  const resting = timer?.sessionKey === key && !timer.complete;
  // Back/Next move along the sets already done, in order, then "now".
  const trail = seq.map((st, i) => (isDone(st) ? i : -1)).filter((i) => i >= 0);
  const backIdx = trail.length - Math.min(back, trail.length);
  const viewingPast = back > 0 && backIdx < trail.length;
  const pos = viewingPast ? trail[backIdx] : allDone ? seq.length : currentPos;
  const showRest = !viewingPast && resting && !allDone;

  const move = (delta) => {
    setDir(delta > 0 ? 'next' : 'prev');
    setFace('front');
    setBack((b) => Math.max(0, Math.min(trail.length, b - delta)));
  };
  // A swipe forward never ticks a set (too easy to do by accident); the buttons do.
  const swipeNext = () => {
    if (viewingPast) move(1);
    else if (showRest) clearTimer();
  };
  const { handlers, dx } = useSwipe({ onPrev: () => move(-1), onNext: swipeNext });

  if (!content) {
    return (
      <GlassCard className="mt-auto gap-2">
        <p className="text-2xl">Rest day. Let your body recover.</p>
      </GlassCard>
    );
  }

  const { done, total } = sessionProgress(session);
  const elapsed = session ? Math.floor((now - new Date(session.startedAt).getTime()) / 1000) : null;

  const restart = () => {
    if (!confirm('Restart this workout? Ticked sets are cleared.')) return;
    discardSession(key);
    setBack(0);
  };

  if (session?.endedAt) {
    return (
      <>
        <div className="flex flex-1 items-center">
          <FocusHeader fraction={total ? done / total : 0} />
        </div>
        <GlassCard className="gap-3">
          <p className="text-[30px] font-light leading-tight">
            {done >= total ? 'Workout done. Strong work.' : 'Ended early.'}
          </p>
          <div className="flex gap-2">
            <GlassButton onClick={() => reopenSession(key)}>
              <RotateCcw className="h-4 w-4" /> Reopen
            </GlassButton>
            <GlassButton onClick={restart}>Restart</GlassButton>
          </div>
        </GlassCard>
      </>
    );
  }

  /** What follows a set once it's ticked (null when it's the very last). */
  const after = (st) => {
    const isDoneAfter = (x) => isDone(x) || (x.ex.id === st.ex.id && x.setIndex === st.setIndex);
    const i = currentIndex(seq, isDoneAfter, focusExId);
    return i >= 0 ? seq[i] : null;
  };
  const labelFor = (st) => {
    const next = after(st);
    if (!next) return 'Finish workout';
    const lastOfExercise = (session?.done[st.ex.id]?.length ?? 0) + 1 >= st.ex.sets;
    return lastOfExercise && next.ex.id !== st.ex.id ? `Start ${next.ex.name}` : 'Next set';
  };

  const complete = (st) => {
    if (!session) startSession({ date, kind: 'workout', day, planId: plan.id });
    const finishesExercise = (session?.done[st.ex.id]?.length ?? 0) + 1 >= st.ex.sets;
    const last = !after(st);
    toggleSet(key, st.ex.id, st.setIndex);
    setLastDone(seq.indexOf(st));
    setDir('next');
    setFace('front');
    setBack(0);
    if (finishesExercise) {
      setStamp(st.ex.name);
      setTimeout(() => setStamp(null), 1400);
    }
    if (last) finishSession(key);
  };
  const undo = (st) => {
    toggleSet(key, st.ex.id, st.setIndex);
    if (resting) clearTimer();
    setDir('prev');
    setFace('front');
    setBack(0);
  };

  const step = seq[pos];
  const upNext = seq[currentPos];
  // The set this rest follows: the one just ticked, else the last one done before now.
  const restFor = seq[lastDone ?? -1] && isDone(seq[lastDone]) ? seq[lastDone] : seq[trail[trail.length - 1]];

  let card;
  if (showRest) {
    const left = timerLeft(timer, now);
    card = (
      <GlassCard className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="text-xl font-medium">Rest</span>
            {restFor && (
              <span className="line-clamp-2 text-[15px] leading-snug opacity-80">
                after {restFor.ex.name} · set {restFor.setIndex + 1}/{restFor.ex.sets}
              </span>
            )}
          </span>
          <Chip icon={Timer} tone="soft">
            {timer.total} s
          </Chip>
        </div>
        <span className="text-[88px] font-light leading-[0.95] tracking-tighter tabular-nums">{clock(left)}</span>
        <Bar fraction={timer.total ? 1 - left / timer.total : 0} />
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[15px] opacity-80">Up next</span>
          <Chip tone="solid">{upNext.ex.name}</Chip>
          <Chip tone="line">
            {upNext.setIndex + 1}/{upNext.ex.sets}
          </Chip>
        </div>
        <div className="flex gap-2 pt-1">
          <GlassButton onClick={() => adjustTimer(-15)} aria-label="15 seconds less">
            <Minus className="h-4 w-4" /> 15
          </GlassButton>
          <GlassButton onClick={() => adjustTimer(15)} aria-label="15 seconds more">
            <Plus className="h-4 w-4" /> 15
          </GlassButton>
          <GlassButton className="ml-auto" onClick={clearTimer}>
            Skip rest <SkipForward className="h-4 w-4" />
          </GlassButton>
        </div>
      </GlassCard>
    );
  } else if (!step) {
    card = (
      <GlassCard className="gap-4">
        <p className="text-[30px] font-light leading-tight">Every set done.</p>
        <button
          onClick={() => finishSession(key)}
          className="h-[60px] rounded-[18px] text-lg font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          Finish workout
        </button>
      </GlassCard>
    );
  } else {
    card = (
      <SetCard
        step={step}
        exercises={exercises}
        done={isDone(step)}
        face={face}
        setFace={setFace}
        nextLabel={labelFor(step)}
        onNext={() => complete(step)}
        onUndo={() => undo(step)}
      />
    );
  }

  // The Next button does what the card's main button does now.
  const next = () => {
    if (viewingPast) move(1);
    else if (showRest) clearTimer();
    else if (step && !isDone(step)) complete(step);
  };

  return (
    <>
      {/* The header sits centred in the space above the card. */}
      <div className="flex flex-1 items-center py-2">
        <FocusHeader
          phrase={done === 0 && !resting ? startPhrase(key) : null}
          fraction={total ? done / total : 0}
          elapsed={elapsed}
        />
      </div>
      <div className="flex flex-col gap-3">
        <div {...handlers} className="relative" style={{ touchAction: 'pan-y' }}>
          <div
            key={`${pos}-${showRest ? 'rest' : 'set'}`}
            className={dir === 'next' ? 'card-in-next' : 'card-in-prev'}
            style={{ transform: dx ? `translateX(${dx * 0.35}px)` : undefined }}
          >
            {card}
          </div>
          {stamp && (
            <div className="done-stamp pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                className="flex max-w-[90%] items-center gap-2 rounded-full px-5 py-3 text-lg font-medium shadow-lg"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                <Check className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                <span className="line-clamp-2">{stamp} done</span>
              </span>
            </div>
          )}
        </div>
        <StepNav
          onPrev={() => move(-1)}
          onNext={next}
          canPrev={backIdx > 0}
          canNext={viewingPast || showRest || (!!step && !isDone(step))}
        >
          <span className="label text-[10px] opacity-70">
            {done} / {total}
          </span>
        </StepNav>
      </div>
    </>
  );
}
