import { useEffect, useState } from 'react';
import { List, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useStore, sessionKey } from '../../store';
import { glassFor } from '../../lib/sky';
import { dayKeyOf, fromISODate } from '../../lib/dates';
import { estimateWorkoutMinutes, totalSets } from '../../lib/estimate';
import { morningMinutes } from '../../lib/morning';
import { blip, startAmbient } from '../../lib/ambient';
import SessionScreen from '../SessionScreen';
import TimerBar from '../../components/TimerBar';
import StretchFocus from './StretchFocus';
import WorkoutFocus from './WorkoutFocus';
import { AlarmsPreview, MeditatePreview } from './Previews';
import { GlassButton } from './parts';

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
    '--card-bg': g.bg,
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
    return { content: day?.morning && { title: 'Morning stretches', minutes: day.morning.minutes, items: day.morning.items } };
  }
  return { content: day?.exercises.length ? { title: day.title, exercises: day.exercises } : null };
}

/** Title card above the list: what this session is, and the button that starts it. */
function ListHeader({ date, kind, onStart }) {
  const { session, content } = useContent(date, kind);
  if (!content) return null;
  const morning = kind === 'morning';
  const minutes = morning ? morningMinutes(content) : estimateWorkoutMinutes(content.exercises);
  const size = morning
    ? `${content.items.length} moves`
    : `${content.exercises.length} exercises · ${totalSets(content.exercises)} sets`;
  const action = !session ? 'Start' : session.endedAt ? null : 'Resume';
  const when = fromISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="sky-glass flex flex-col gap-2 rounded-[26px] p-5">
      <span className="label opacity-80">
        {morning ? 'Stretch' : 'Workout'} · {when}
      </span>
      <h1 className="text-[30px] font-medium leading-[1.08]">{content.title}</h1>
      <p className="text-[15px] opacity-85">
        ≈ {minutes} min · {size}
      </p>
      {action && (
        <button
          onClick={() => onStart(!session)}
          className="mt-2 flex h-14 items-center justify-center gap-2 rounded-[18px] text-lg font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <Play className="h-5 w-5" fill="currentColor" /> {action}
        </button>
      )}
    </div>
  );
}

/**
 * Full-screen view over the revealed sky. Stretch and workout open on the
 * day's list with a Start button; Start counts 3-2-1 into the focus view.
 * Meditate and alarms are previews for now.
 */
export default function RevealOverlay({ reveal, sky, now, music, onToggleMusic, onClose, onShowList, onFocus }) {
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(null); // 3, 2, 1 while counting down
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { kind, date } = reveal;
  const isSession = kind === 'morning' || kind === 'workout';
  const hasMusic = kind === 'morning' || kind === 'meditate';

  // Into focus: a workout's clock starts now; stretches start their first move when the focus view opens.
  const begin = () => {
    const st = useStore.getState();
    if (kind === 'workout' && !st.sessions[sessionKey(date, kind)]) {
      const plan = st.activePlan();
      st.startSession({ date, kind, day: plan.days[dayKeyOf(fromISODate(date))], planId: plan.id });
    }
    onFocus();
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
        begin();
      }
    }, 1000);
    return () => clearTimeout(id);
    // begin only reads the store and props that stay fixed while this view is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const start = (fresh) => {
    // Sound has to start inside the tap.
    if (music && kind === 'morning') startAmbient();
    if (!fresh) return begin();
    blip();
    setCount(3);
  };

  return (
    <div
      className="reveal absolute inset-0 z-30 flex flex-col transition-opacity duration-500"
      style={{
        ...skyVars(sky),
        opacity: shown ? 1 : 0,
        transitionDelay: shown ? '250ms' : '0ms',
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-2">
        <GlassButton onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" /> Close
        </GlassButton>
        <span className="flex-1" />
        {isSession && !reveal.list && (
          <GlassButton onClick={onShowList} aria-label="Full list">
            <List className="h-4 w-4" /> List
          </GlassButton>
        )}
        {hasMusic && (
          <GlassButton onClick={onToggleMusic} aria-pressed={music} aria-label={music ? 'Mute sound' : 'Play sound'}>
            {music ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {music ? 'Rain' : 'Off'}
          </GlassButton>
        )}
      </div>

      {count != null ? (
        <div className="flex flex-1 items-center justify-center" aria-live="assertive">
          <span key={count} className="count-pop text-[180px] font-light leading-none tabular-nums">
            {count}
          </span>
        </div>
      ) : isSession && reveal.list ? (
        <>
          <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-3">
            <ListHeader date={date} kind={kind} onStart={start} />
            <SessionScreen date={date} kind={kind} onBack={onClose} embedded />
          </div>
          <div className="px-2">
            <TimerBar now={now} />
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3">
          {kind === 'morning' && <StretchFocus date={date} now={now} />}
          {kind === 'workout' && <WorkoutFocus date={date} now={now} />}
          {kind === 'meditate' && <MeditatePreview />}
          {kind === 'alarms' && <AlarmsPreview />}
        </div>
      )}
    </div>
  );
}
