import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ListChecks, Play } from 'lucide-react';
import { useStore, sessionProgress } from './store';
import { todayISO } from './lib/dates';
import WeekScreen from './screens/WeekScreen';
import SessionScreen from './screens/SessionScreen';
import PlansScreen from './screens/PlansScreen';
import TimerBar from './components/TimerBar';

const ORB = {
  week: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
  morning: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)',
  workout: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
  plans: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)',
};

/** Short beep + vibration when a timer runs out. Both are best effort. */
function alertTimerDone() {
  try {
    navigator.vibrate?.([200, 100, 200]);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // no audio available
  }
}

/**
 * Timers store an absolute end time, so they keep counting while the user is on
 * another screen or the tab is in the background; this tick only redraws and
 * fires the end-of-timer action.
 */
function useTicker() {
  const [now, setNow] = useState(Date.now());
  const timer = useStore((s) => s.timer);
  const expireTimer = useStore((s) => s.expireTimer);
  const firedFor = useRef(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  useEffect(() => {
    if (timer && now >= timer.endsAt && firedFor.current !== timer.endsAt) {
      firedFor.current = timer.endsAt;
      // Only make noise if it ran out recently, not when reopening the app hours later.
      if (now - timer.endsAt < 10_000) alertTimerDone();
      expireTimer();
    }
  }, [now, timer, expireTimer]);

  return now;
}

export default function App() {
  const now = useTicker();
  const [screen, setScreen] = useState('week'); // 'week' | 'session' | 'plans'
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [open, setOpen] = useState(null); // { date, kind }
  const activeKey = useStore((s) => s.activeSessionKey);
  const active = useStore((s) => (s.activeSessionKey ? s.sessions[s.activeSessionKey] : null));
  const hasTimer = useStore((s) => !!s.timer);

  const openSession = (date, kind) => {
    setOpen({ date, kind });
    setScreen('session');
    window.scrollTo(0, 0);
  };

  const viewingActive = screen === 'session' && open && active && active.date === open.date && active.kind === open.kind;
  const showResume = active && !active.endedAt && !viewingActive;
  const { done, total } = sessionProgress(active);
  const orb = screen === 'session' ? ORB[open?.kind ?? 'workout'] : ORB[screen];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="orb" style={{ background: orb }} />
      <main className="relative z-10 mx-auto max-w-md px-4 pb-48 pt-8">
        {screen === 'week' && (
          <WeekScreen selectedDate={selectedDate} onSelectDate={setSelectedDate} onOpenSession={openSession} />
        )}
        {screen === 'session' && open && (
          <SessionScreen key={`${open.date}|${open.kind}`} date={open.date} kind={open.kind} onBack={() => setScreen('week')} />
        )}
        {screen === 'plans' && <PlansScreen />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md">
        {showResume && (
          <div className="px-4 pb-2">
            <button
              key={activeKey}
              onClick={() => openSession(active.date, active.kind)}
              className="glass flex w-full items-center gap-3 px-4 py-3 text-left"
              style={{ background: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.35)' }}
            >
              <Play className="h-4 w-4" style={{ color: '#22d3ee' }} />
              <span className="flex-1 text-sm font-semibold">
                {active.kind === 'morning' ? 'Stretches' : 'Workout'} in progress
              </span>
              <span className="text-xs text-2">
                {done}/{total} · Resume
              </span>
            </button>
          </div>
        )}
        <TimerBar now={now} />
        <nav
          className={`sheet flex ${hasTimer ? '' : 'rounded-t-2xl'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {[
            ['week', 'Week', CalendarDays],
            ['plans', 'Plans', ListChecks],
          ].map(([id, label, Icon]) => {
            const on = screen === id || (id === 'week' && screen === 'session');
            return (
              <button
                key={id}
                onClick={() => setScreen(id)}
                className="flex flex-1 flex-col items-center gap-0.5 py-3 text-xs"
                style={{ color: on ? 'white' : 'var(--text-3)' }}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
