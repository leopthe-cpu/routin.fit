import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Clock, List, PersonStanding, Play, Repeat, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useStore, sessionKey } from '../../store';
import { glassFor } from '../../lib/sky';
import { dayKeyOf, fromISODate } from '../../lib/dates';
import { estimateWorkoutMinutes, musclesFor, stretchAreas, totalSets } from '../../lib/estimate';
import BodyMap from '../../components/BodyMap';
import { morningMinutes } from '../../lib/morning';
import { blip, startAmbient } from '../../lib/ambient';
import SessionScreen from '../SessionScreen';
import TimerBar from '../../components/TimerBar';
import StretchFocus from './StretchFocus';
import WorkoutFocus from './WorkoutFocus';
import { AlarmEditor, GoalsView, RestDay } from './Previews';
import Meditate from './Meditate';
import { useSwipe } from '../../hooks/useSwipe';
import { useNow } from '../../hooks/useNow';
import { Chip, FlipCard, GlassButton } from './parts';

/** Theme variables so everything inside reads well on the current sky, including the reused list view. */
function skyVars(sky) {
  const g = glassFor(sky);
  const ink = (a) => `rgb(${g.inkRgb} / ${a})`;
  return {
    color: sky.ink,
    '--ink-rgb': g.inkRgb,
    '--text-1': ink(0.95),
    '--text-2': ink(0.75),
    '--text-3': ink(0.6),
    '--line': ink(0.2),
    '--track': g.track,
    '--glass-bg': g.bg,
    '--glass-border': g.border,
    '--glass-btn': g.btn,
    '--glass-solid': g.solid,
    '--card-bg': g.card,
    '--card-border': g.border,
    '--card-shadow': 'none',
    '--accent': sky.ink,
    '--accent-grad': sky.ink,
    '--on-accent': g.onInk,
    '--sheet': g.bg,
  };
}

/** The day's session as planned, or as snapshotted once started. */
function useContent(date, kind) {
  const plan = useStore((s) => s.activePlan());
  const session = useStore((s) => s.sessions[sessionKey(date, kind)]);
  const day = plan?.days[dayKeyOf(fromISODate(date))];
  if (session) return { session, content: session.snapshot };
  if (kind === 'morning') {
    return {
      content: day?.morning && { title: 'Morning stretches', minutes: day.morning.minutes, items: day.morning.items },
    };
  }
  return { content: day?.exercises.length ? { title: day.title, exercises: day.exercises } : null };
}

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

/**
 * Title card above the list: what this session is, and the button that starts
 * it. It stays pinned while the list scrolls under it; the muscle chip turns
 * it over to show the worked areas on a body map.
 */
function ListHeader({ date, kind, onStart }) {
  const { session, content } = useContent(date, kind);
  const discardSession = useStore((s) => s.discardSession);
  const [face, setFace] = useState('front');
  if (!content) return null;
  const morning = kind === 'morning';
  const minutes = morning ? morningMinutes(content) : estimateWorkoutMinutes(content.exercises);
  const size = morning
    ? `${content.items.length} moves`
    : `${content.exercises.length} exercises · ${totalSets(content.exercises)} sets`;
  const areas = morning ? stretchAreas(content.items) : musclesFor(content.exercises);
  const action = !session ? 'Start' : session.endedAt ? null : 'Resume';
  const when = fromISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  const toggle = () => setFace((f) => (f === 'front' ? 'muscles' : 'front'));

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      {areas.length > 0 && (
        <Chip icon={PersonStanding} tone="solid" active={face === 'muscles'} onClick={toggle}>
          {areas.map(cap).join(' · ')}
        </Chip>
      )}
      <Chip icon={Clock} tone="soft">
        ≈ {minutes} min
      </Chip>
      <Chip icon={Repeat} tone="line">
        {size}
      </Chip>
    </div>
  );

  return (
    <FlipCard
      face={face}
      className="list-head !gap-2.5"
      render={(f) => (
        <>
          <span className="label opacity-80">
            {morning ? 'Stretch' : 'Workout'} · {when}
          </span>
          <h1 className="text-[26px] font-medium leading-[1.1]">{content.title}</h1>
          {chips}
          {f === 'muscles' ? (
            <button onClick={toggle} className="flex flex-col gap-2 pt-1 text-left" aria-label="Turn back">
              <BodyMap muscles={areas} />
              <span className="label text-center text-[10px] opacity-70">Tap to turn back</span>
            </button>
          ) : (
            <div className="mt-1 flex gap-2">
              {action && (
                <button
                  onClick={() => onStart(!session)}
                  className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[18px] text-lg font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                >
                  <Play className="h-5 w-5" fill="currentColor" /> {action}
                </button>
              )}
              {session && (
                <button
                  onClick={() => {
                    if (confirm('Restart from scratch? Everything ticked in this session is cleared.')) {
                      discardSession(sessionKey(date, kind));
                    }
                  }}
                  className={`sky-btn flex h-[52px] items-center justify-center gap-2 rounded-[18px] px-5 text-[16px] ${action ? '' : 'flex-1'}`}
                >
                  <RotateCcw className="h-4 w-4" /> Restart
                </button>
              )}
            </div>
          )}
        </>
      )}
    />
  );
}

/**
 * Full-screen view over the revealed sky. Stretch and workout open on the
 * day's list with a Start button; Start counts 3-2-1 into the focus view.
 * Meditate and alarms are previews for now.
 */
export default function RevealOverlay({ reveal, sky, music, onToggleMusic, onClose, onShowList, onFocus, onSwitch }) {
  // Timers on these screens count in quarter seconds; only this view redraws that often.
  const now = useNow(250);
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(null); // 3, 2, 1 while counting down
  const timerHere = useStore((s) => s.timer?.sessionKey === sessionKey(reveal.date, reveal.kind));
  const afterCount = useRef(null);
  // Pulling down from the top half minimizes the view (the session keeps going).
  const pull = useSwipe({ onDown: onClose });
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { kind, date } = reveal;
  const isSession = kind === 'morning' || kind === 'workout';
  const hasMusic = kind === 'morning' || kind === 'meditate';

  // Into focus: a workout's clock starts now; stretches start their first move when the focus view opens.
  const begin = (extra = {}) => {
    const st = useStore.getState();
    if (kind === 'workout' && !st.sessions[sessionKey(date, kind)]) {
      const plan = st.activePlan();
      st.startSession({ date, kind, day: plan.days[dayKeyOf(fromISODate(date))], planId: plan.id });
    }
    onFocus(extra);
  };

  useEffect(() => {
    if (count == null) return undefined;
    const id = setTimeout(() => {
      if (count > 1) {
        blip();
        setCount(count - 1);
      } else {
        blip(true);
        setCount(null);
        afterCount.current?.();
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [count]);

  /** 3-2-1 with a soft blip on each number, then `then`. */
  const countdown = (then) => {
    afterCount.current = then;
    blip();
    setCount(3);
  };

  const start = (fresh, extra) => {
    // Sound has to start inside the tap.
    if (music && kind === 'morning') startAmbient();
    if (!fresh) return begin(extra);
    countdown(() => begin(extra));
  };

  // From the list: do this exercise next (the order resumes after it).
  const pick = (exId) => start(!useStore.getState().sessions[sessionKey(date, kind)], { focusExId: exId });

  return (
    <div
      className="reveal absolute inset-0 z-30 flex flex-col transition-opacity duration-500"
      style={{
        ...skyVars(sky),
        opacity: shown ? 1 : 0,
        transitionDelay: shown ? '250ms' : '0ms',
        // Clear of the status bar and Dynamic Island, with a little air so nothing sits where taps don't land.
        paddingTop: 'calc(var(--sat) + 6px)',
        paddingBottom: 'var(--sab-gap)',
      }}
    >
      {/* Grab handle and top bar: drag down here to minimize. */}
      <div {...pull.handlers} style={{ touchAction: 'none' }}>
        <div className="flex h-4 items-center justify-center" aria-hidden="true">
          <span className="h-1 w-10 rounded-full" style={{ background: 'rgb(var(--ink-rgb) / 0.35)' }} />
        </div>
        <div className="flex items-center gap-2 px-4 pt-0.5">
          <button
            onClick={onClose}
            aria-label={isSession ? 'Minimize' : 'Close'}
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ border: '1px solid var(--glass-border)' }}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <span className="flex-1" />
          {isSession && !reveal.list && (
            <button
              onClick={onShowList}
              aria-label="Full list"
              className="flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[15px] font-medium"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              <List className="h-4 w-4" /> List
            </button>
          )}
          {hasMusic && (
            <GlassButton onClick={onToggleMusic} aria-pressed={music} aria-label={music ? 'Mute sound' : 'Play sound'}>
              {music ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {music ? 'Rain' : 'Off'}
            </GlassButton>
          )}
        </div>
      </div>
      {count != null && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" aria-live="assertive">
          <span key={count} className="count-pop text-[180px] font-light leading-none tabular-nums">
            {count}
          </span>
        </div>
      )}
      {/* Content stays mounted under the countdown (meditation keeps its choices and sound). */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          opacity: count != null ? 0 : 1,
          transition: 'opacity 200ms',
          pointerEvents: count != null ? 'none' : undefined,
        }}
      >
        {isSession && reveal.list ? (
          <>
            <div className="no-scrollbar mt-2 min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
              <div className="sticky top-0 z-10">
                <ListHeader date={date} kind={kind} onStart={start} />
              </div>
              <SessionScreen
                date={date}
                kind={kind}
                onBack={onClose}
                embedded
                onPick={kind === 'workout' ? pick : undefined}
              />
            </div>
            {timerHere && (
              <div className="px-2">
                <TimerBar now={now} />
              </div>
            )}
          </>
        ) : (
          <div {...pull.handlers} className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3">
            {kind === 'morning' && <StretchFocus date={date} now={now} />}
            {kind === 'workout' && <WorkoutFocus date={date} now={now} focusExId={reveal.focusExId} />}
            {kind === 'meditate' && <Meditate sky={sky} now={now} countdown={countdown} />}
            {kind === 'alarms' && <AlarmEditor />}
            {kind === 'goals' && <GoalsView date={date} />}
            {kind === 'rest' && <RestDay date={date} onSwitch={onSwitch} />}
          </div>
        )}
      </div>
    </div>
  );
}
