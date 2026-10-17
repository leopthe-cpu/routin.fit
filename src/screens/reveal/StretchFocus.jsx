import { useEffect, useRef, useState } from 'react';
import { Check, Clock, ExternalLink, Info, PersonStanding, Plus, RotateCcw, Repeat } from 'lucide-react';
import { useStore, sessionKey, sessionProgress, timerLeft, moveSeconds } from '../../store';
import { dayKeyOf, fromISODate } from '../../lib/dates';
import { findStretch } from '../../data/stretches';
import { cueAt, startPhrase } from '../../lib/flow';
import { formLinks } from '../../lib/youtube';
import { clock } from '../../lib/clock';
import { useSwipe } from '../../hooks/useSwipe';
import { Bar, Chip, FlipCard, FocusHeader, GlassButton, GlassCard, StepNav } from './parts';

const titleOf = (name) => findStretch(name)?.name ?? name.charAt(0).toUpperCase() + name.slice(1);

const isTicked = (session, i) => !!session?.done[`m-${i}`]?.includes(0);
const nextUnticked = (session) => session.snapshot.items.findIndex((_, i) => !isTicked(session, i));

function backFor(face, name, seconds) {
  const s = findStretch(name);
  if (face === 'dose') {
    return {
      title: s?.dose.label ?? `${seconds} s`,
      body: s?.dose.perSide
        ? `${seconds} seconds in all. The timer beeps halfway so you know when to switch to ${s.dose.sideLabels?.[1]?.toLowerCase() ?? 'the other side'}.`
        : `${seconds} seconds. Move slowly; the timer moves you on to the next stretch by itself.`,
    };
  }
  if (face === 'what')
    return { title: s?.what ?? titleOf(name), body: s?.benefit ?? 'Move gently, within a comfortable range.' };
  return { title: 'Form', body: 'A short form animation is coming. Until then, watch a demo:' };
}

/**
 * Hands-free stretching: each move flows into the next and tapping the timer
 * pauses. Swipe (or Back / Next) moves between stretches; going back reopens
 * the previous one and runs its timer again.
 */
export default function StretchFocus({ date, now }) {
  const plan = useStore((s) => s.activePlan());
  const key = sessionKey(date, 'morning');
  const session = useStore((s) => s.sessions[key]);
  const timer = useStore((s) => s.timer);
  const {
    startSession,
    pauseTimer,
    resumeTimer,
    expireTimer,
    adjustTimer,
    reopenSession,
    discardSession,
    startMoveTimer,
    toggleSet,
  } = useStore();
  const day = plan?.days[dayKeyOf(fromISODate(date))];
  const begun = useRef(false);
  const [face, setFace] = useState('front');
  const [dir, setDir] = useState('next');

  // Opening the focus view starts the routine or carries on where it stopped.
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

  const content =
    session?.snapshot ?? (day?.morning ? { items: day.morning.items, minutes: day.morning.minutes } : null);
  const running = !!(session && !session.endedAt && timer?.sessionKey === key && timer.complete);
  const index = running
    ? Number(timer.complete.itemId.slice(2))
    : session && !session.endedAt
      ? nextUnticked(session)
      : 0;

  const goTo = (i) => {
    if (!session && day?.morning && plan) {
      // After a restart: begin again from the first move.
      startSession({ date, kind: 'morning', day, planId: plan.id });
      startMoveTimer(key, 0);
      return;
    }
    if (!session || session.endedAt || !content || i < 0 || i >= content.items.length) return;
    setDir(i > index ? 'next' : 'prev');
    setFace('front');
    if (i > index && running) {
      expireTimer(); // ticks this move and starts the next
      return;
    }
    if (isTicked(session, i)) toggleSet(key, `m-${i}`, 0);
    startMoveTimer(key, i);
  };
  const { handlers, dx } = useSwipe({ onPrev: () => goTo(index - 1), onNext: () => goTo(index + 1) });

  if (!content) {
    return (
      <GlassCard className="mt-auto gap-2">
        <p className="text-2xl">No stretches planned today.</p>
      </GlassCard>
    );
  }

  const { done, total } = sessionProgress(session);
  const elapsed = session ? Math.floor((now - new Date(session.startedAt).getTime()) / 1000) : null;
  const restart = () => {
    if (!confirm('Restart the stretches from the first move?')) return;
    discardSession(key);
    begun.current = false;
  };

  if (session?.endedAt) {
    return (
      <>
        <div className="flex flex-1 items-center">
          <FocusHeader fraction={total ? done / total : 0} />
        </div>
        <GlassCard className="gap-3">
          <p className="text-[30px] font-light leading-tight">
            {done >= total ? 'All done. Nice start.' : 'Ended early.'}
          </p>
          <div className="flex gap-2">
            <GlassButton
              onClick={() => {
                reopenSession(key);
                const next = nextUnticked(session);
                if (next >= 0) startMoveTimer(key, next);
              }}
            >
              <RotateCcw className="h-4 w-4" /> {done >= total ? 'Go again' : 'Continue'}
            </GlassButton>
            <GlassButton onClick={restart}>Restart</GlassButton>
          </div>
        </GlassCard>
      </>
    );
  }

  const name = content.items[Math.max(0, index)];
  const stretch = findStretch(name);
  const seconds = moveSeconds(content, Math.max(0, index));
  const left = running ? timerLeft(timer, now) : seconds;
  const fraction = running && timer.total ? 1 - left / timer.total : 0;
  const paused = !!timer?.pausedAt;
  const at = timer?.pausedAt ?? now;
  const side = running && timer.switchAt ? (at < timer.switchAt ? timer.sideLabels[0] : timer.sideLabels[1]) : null;
  const toggle = (k) => setFace(face === k ? 'front' : k);
  // Progress counts the running move's elapsed share, so the bar fills continuously.
  const progress = total ? Math.min(1, (done + (running ? fraction : 0)) / total) : 0;

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      <Chip icon={Clock} tone="solid" active={face === 'dose'} onClick={() => toggle('dose')}>
        {stretch?.dose.label ?? `${seconds} s`}
      </Chip>
      {stretch?.dose.perSide && (
        <Chip icon={Repeat} tone="line">
          {side ?? stretch.dose.sideLabels?.[0]} → switch at {Math.round(seconds / 2)} s
        </Chip>
      )}
      <Chip icon={Info} tone="line" active={face === 'what'} onClick={() => toggle('what')}>
        What it does
      </Chip>
      <Chip icon={PersonStanding} tone="soft" active={face === 'form'} onClick={() => toggle('form')}>
        Form
      </Chip>
    </div>
  );

  return (
    <>
      <div className="flex flex-1 items-center py-2">
        <FocusHeader
          phrase={index <= 0 && done === 0 && fraction < 0.05 ? startPhrase(key) : null}
          fraction={progress}
          elapsed={elapsed}
        />
      </div>
      <div className="flex flex-col gap-3">
        <div {...handlers} style={{ touchAction: 'pan-y' }}>
          <div
            key={index}
            className={dir === 'next' ? 'card-in-next' : 'card-in-prev'}
            style={{ transform: dx ? `translateX(${dx * 0.35}px)` : undefined }}
          >
            <FlipCard
              face={face}
              render={(f) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[28px] font-medium leading-[1.08]">{titleOf(name)}</h2>
                    <span
                      className="shrink-0 rounded-full px-3 py-0.5 text-[24px] font-light tabular-nums"
                      style={{ background: 'rgb(var(--ink-rgb) / 0.12)' }}
                    >
                      {index + 1}/{content.items.length}
                    </span>
                  </div>
                  {chips}
                  {f === 'front' ? (
                    <button
                      onClick={() => (running ? (paused ? resumeTimer() : pauseTimer()) : goTo(index))}
                      aria-label={!running ? 'Start this stretch' : paused ? 'Resume' : 'Pause'}
                      className="flex flex-col gap-2 text-left"
                    >
                      <span
                        className="text-[84px] font-light leading-[0.95] tracking-tighter tabular-nums"
                        style={{ opacity: paused || !running ? 0.55 : 1 }}
                      >
                        {clock(left)}
                      </span>
                      <span className="min-h-[50px] text-[18px] font-light leading-snug">
                        {!running ? 'Tap to start this stretch.' : paused ? 'Paused.' : cueAt(stretch, fraction)}
                      </span>
                      <Bar fraction={fraction} />
                      <span className="label text-[10px] opacity-75">
                        {!running ? 'Tap to start' : paused ? 'Paused · tap to continue' : 'Tap to pause'}
                      </span>
                    </button>
                  ) : (
                    <button onClick={() => setFace('front')} className="flex min-h-[176px] flex-col gap-2 text-left">
                      <span className="text-xl font-medium">{backFor(f, name, seconds).title}</span>
                      <span className="text-[16px] leading-snug opacity-90">{backFor(f, name, seconds).body}</span>
                      {f === 'form' &&
                        formLinks(name).map((l) => (
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
                      <span className="label mt-auto pt-2 text-[10px] opacity-70">Tap to turn back</span>
                    </button>
                  )}
                </>
              )}
            />
          </div>
        </div>
        <StepNav
          onPrev={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
          canPrev={index > 0}
          canNext={index < content.items.length - 1 || running}
        >
          <GlassButton onClick={() => adjustTimer(15)} disabled={!running} aria-label="Add 15 seconds">
            <Plus className="h-4 w-4" /> 15 s
          </GlassButton>
        </StepNav>
        {done > 0 && (
          <span className="label flex items-center justify-center gap-1.5 text-[10px] opacity-70">
            <Check className="h-3 w-3" /> {done} of {total} done
          </span>
        )}
      </div>
    </>
  );
}
