import { useEffect, useState } from 'react';
import { List, Target, Volume2, VolumeX, X } from 'lucide-react';
import { glassFor } from '../../lib/sky';
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

/**
 * Full-screen view over the revealed sky. Stretch and workout open in focus
 * mode with a toggle to the full list for the day; meditate and alarms are
 * previews for now.
 */
export default function RevealOverlay({ reveal, sky, now, music, onToggleMusic, onClose, onToggleList }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const session = reveal.kind === 'morning' || reveal.kind === 'workout';
  const hasMusic = reveal.kind === 'morning' || reveal.kind === 'meditate';

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
        {session && (
          <GlassButton onClick={onToggleList} aria-label={reveal.list ? 'Focus view' : 'Full list'}>
            {reveal.list ? <Target className="h-4 w-4" /> : <List className="h-4 w-4" />}
            {reveal.list ? 'Focus' : 'List'}
          </GlassButton>
        )}
        {hasMusic && (
          <GlassButton onClick={onToggleMusic} aria-pressed={music} aria-label={music ? 'Mute sound' : 'Play sound'}>
            {music ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {music ? 'Rain' : 'Off'}
          </GlassButton>
        )}
      </div>

      {session && reveal.list ? (
        <>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-3">
            <SessionScreen date={reveal.date} kind={reveal.kind} onBack={reveal.fromWeek ? onClose : onToggleList} />
          </div>
          <div className="px-2">
            <TimerBar now={now} />
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3">
          {reveal.kind === 'morning' && <StretchFocus date={reveal.date} now={now} />}
          {reveal.kind === 'workout' && <WorkoutFocus date={reveal.date} now={now} />}
          {reveal.kind === 'meditate' && <MeditatePreview />}
          {reveal.kind === 'alarms' && <AlarmsPreview />}
        </div>
      )}
    </div>
  );
}
