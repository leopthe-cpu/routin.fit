import { useEffect, useRef } from 'react';
import { Plus, RotateCcw, SkipForward } from 'lucide-react';
import { useStore, sessionKey, sessionProgress, timerLeft, moveSeconds } from '../../store';
import { dayKeyOf, fromISODate } from '../../lib/dates';
import { findStretch } from '../../data/stretches';
import { cueAt } from '../../lib/flow';
import { Bar, Eyebrow, GlassButton, GlassCard, clock } from './parts';

const titleOf = (name) => findStretch(name)?.name ?? name.charAt(0).toUpperCase() + name.slice(1);

const nextUnticked = (session) => session.snapshot.items.findIndex((_, i) => !session.done[`m-${i}`]?.includes(0));

/**
 * Hands-free stretching: opening it starts (or resumes) the routine, each move
 * flows into the next, and tapping the big card pauses.
 */
export default function StretchFocus({ date, now }) {
  const plan = useStore((s) => s.activePlan());
  const key = sessionKey(date, 'morning');
  const session = useStore((s) => s.sessions[key]);
  const timer = useStore((s) => s.timer);
  const { pauseTimer, resumeTimer, expireTimer, adjustTimer, reopenSession, startMoveTimer } = useStore();
  const day = plan?.days[dayKeyOf(fromISODate(date))];
  const begun = useRef(false);

  // Opening the view is the "play" tap: start the routine or carry on where it stopped.
  useEffect(() => {
    if (begun.current) return;
    begun.current = true;
    const st = useStore.getState();
    let s = st.sessions[key];
    if (s?.endedAt) return;
    if (!s) {
      if (!day?.morning || !plan) return;
      st.startSession({ date, kind: 'morning', day, planId: plan.id });
      s = useStore.getState().sessions[key];
    }
    if (useStore.getState().timer?.sessionKey === key) return;
    const next = nextUnticked(s);
    if (next >= 0) useStore.getState().startMoveTimer(key, next);
  }, [key, date, day, plan]);

  const content = session?.snapshot ?? (day?.morning ? { items: day.morning.items, minutes: day.morning.minutes } : null);
  if (!content) {
    return (
      <GlassCard className="mt-auto gap-2">
        <Eyebrow>Stretch</Eyebrow>
        <p className="text-2xl">Nothing planned today.</p>
      </GlassCard>
    );
  }

  const { done, total } = sessionProgress(session);

  if (session?.endedAt) {
    return (
      <GlassCard className="mt-auto gap-3">
        <Eyebrow>
          Stretch · {done} of {total}
        </Eyebrow>
        <p className="text-[32px] font-light leading-tight">{done >= total ? 'All done. Nice start.' : 'Ended early.'}</p>
        <GlassButton
          className="self-start"
          onClick={() => {
            reopenSession(key);
            const next = nextUnticked(session);
            if (next >= 0) startMoveTimer(key, next);
          }}
        >
          <RotateCcw className="h-4 w-4" /> {done >= total ? 'Go again' : 'Continue'}
        </GlassButton>
      </GlassCard>
    );
  }

  const running = timer?.sessionKey === key && timer.complete;
  if (!running) {
    const next = session ? nextUnticked(session) : 0;
    return (
      <GlassCard as="button" className="mt-auto gap-2" onClick={() => next >= 0 && startMoveTimer(key, next)}>
        <Eyebrow>
          Stretch · {done} of {total}
        </Eyebrow>
        <span className="text-[32px] font-light leading-tight">Tap to continue</span>
        {next >= 0 && <span className="text-lg opacity-85">Next: {titleOf(content.items[next])}</span>}
      </GlassCard>
    );
  }

  const index = Number(timer.complete.itemId.slice(2));
  const name = content.items[index];
  const stretch = findStretch(name);
  const left = timerLeft(timer, now);
  const fraction = timer.total ? 1 - left / timer.total : 0;
  const paused = !!timer.pausedAt;
  const at = timer.pausedAt ?? now;
  const side = timer.switchAt ? (at < timer.switchAt ? timer.sideLabels[0] : timer.sideLabels[1]) : null;
  const nextIdx = content.items.findIndex((_, i) => i > index && !session.done[`m-${i}`]?.includes(0));

  return (
    <div className="mt-auto flex flex-col gap-3">
      <GlassCard
        as="button"
        className="gap-2.5"
        onClick={() => (paused ? resumeTimer() : pauseTimer())}
        aria-label={paused ? 'Resume' : 'Pause'}
      >
        <Eyebrow>
          Stretch · {index + 1} of {content.items.length}
          {side ? ` · ${side}` : ''}
        </Eyebrow>
        <span className="text-[88px] font-light leading-[0.95] tracking-tighter tabular-nums" style={{ opacity: paused ? 0.55 : 1 }}>
          {clock(left)}
        </span>
        <span className="text-[26px] font-medium leading-tight">{titleOf(name)}</span>
        <span className="min-h-[52px] text-[19px] font-light leading-snug">{paused ? 'Paused.' : cueAt(stretch, fraction)}</span>
        <Bar fraction={fraction} />
        <span className="label text-[10px] opacity-75">
          {paused ? 'Paused · tap to continue' : 'Tap to pause'}
          {nextIdx >= 0 && ` · Next: ${titleOf(content.items[nextIdx])}, ${moveSeconds(content, nextIdx)} s`}
        </span>
      </GlassCard>
      <div className="flex justify-end gap-2">
        <GlassButton onClick={() => adjustTimer(15)} aria-label="Add 15 seconds">
          <Plus className="h-4 w-4" /> 15 s
        </GlassButton>
        <GlassButton onClick={expireTimer} aria-label="Next move">
          Next <SkipForward className="h-4 w-4" />
        </GlassButton>
      </div>
    </div>
  );
}
