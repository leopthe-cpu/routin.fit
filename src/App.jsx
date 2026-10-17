import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { todayISO } from './lib/dates';
import { SKIES, greetingFor, pickPhrase, PHRASES, slotFor } from './lib/sky';
import { startAmbient, stopAmbient } from './lib/ambient';
import Sky from './components/Sky';
import TimerBar from './components/TimerBar';
import SessionIsland from './components/SessionIsland';
import TodayScreen from './screens/TodayScreen';
import WeekScreen from './screens/WeekScreen';
import PlansScreen from './screens/PlansScreen';
import GoalsSection from './screens/GoalsSection';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import RevealOverlay from './screens/reveal/RevealOverlay';

const PAGES = ['Today', 'Plans', 'Progress', 'Settings'];

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
 * fires the end-of-timer action. A paused timer never fires.
 */
function useTicker() {
  const [now, setNow] = useState(Date.now());
  const timer = useStore((s) => s.timer);
  const expireTimer = useStore((s) => s.expireTimer);
  const firedFor = useRef(null);
  const switchedFor = useRef(null);

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
    if (!timer || timer.pausedAt) return;
    // Halfway cue on moves done one side at a time.
    if (timer.switchAt && now >= timer.switchAt && now < timer.endsAt && switchedFor.current !== timer.switchAt) {
      switchedFor.current = timer.switchAt;
      if (now - timer.switchAt < 10_000) alertTimerDone();
    }
    if (now >= timer.endsAt && firedFor.current !== timer.endsAt) {
      firedFor.current = timer.endsAt;
      // Only make noise if it ran out recently, not when reopening the app hours later.
      if (now - timer.endsAt < 10_000) alertTimerDone();
      expireTimer();
    }
  }, [now, timer, expireTimer]);

  return now;
}

/** `?sky=late` previews a time of day; otherwise the sky follows the clock. */
function useSlot(now) {
  const forced = new URLSearchParams(window.location.search).get('sky');
  return SKIES[forced] ? forced : slotFor(new Date(now).getHours());
}

/** A new phrase each time the app is opened, or brought back after a while away. */
function usePhrase() {
  const setLastPhrase = useStore((s) => s.setLastPhrase);
  const [index, setIndex] = useState(() => pickPhrase(useStore.getState().lastPhrase));
  useEffect(() => setLastPhrase(index), [index, setLastPhrase]);
  useEffect(() => {
    let hiddenAt = 0;
    const onChange = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000) setIndex((i) => pickPhrase(i));
    };
    document.addEventListener('visibilitychange', onChange);
    // While the app is open, a new phrase drifts in every 90 seconds.
    const id = setInterval(() => !document.hidden && setIndex((i) => pickPhrase(i)), 90_000);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
      clearInterval(id);
    };
  }, []);
  return PHRASES[index];
}

export default function App() {
  const now = useTicker();
  const slot = useSlot(now);
  const sky = SKIES[slot];
  const phrase = usePhrase();
  const name = useStore((s) => s.settings.name.trim());
  const music = useStore((s) => s.settings.music);
  const setSettings = useStore((s) => s.setSettings);
  const hasTimer = useStore((s) => !!s.timer);
  // Kind of the session in progress, if any ('morning' | 'workout').
  const activeKind = useStore((s) => {
    const a = s.activeSessionKey && s.sessions[s.activeSessionKey];
    return a && !a.endedAt ? a.kind : null;
  });

  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  // { kind: 'morning' | 'workout' | 'meditate' | 'alarms', date, list, fromWeek }
  const [reveal, setReveal] = useState(null);

  // Panel theme and browser chrome follow the sky.
  useEffect(() => {
    document.documentElement.dataset.theme = slot === 'evening' ? 'night' : 'day';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sky.base);
  }, [slot, sky.base]);

  // Back button / swipe-back closes a revealed view instead of leaving the app.
  useEffect(() => {
    const onPop = () => {
      // Minimizing a running stretch keeps its sound; anything else goes quiet.
      const st = useStore.getState();
      const a = st.activeSessionKey && st.sessions[st.activeSessionKey];
      if (!(a && !a.endedAt && a.kind === 'morning')) stopAmbient();
      setReveal(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const open = useCallback(
    (kind, opts = {}) => {
      window.history.pushState({ reveal: kind }, '');
      // Stretch and workout open on the day's list, where Start counts down into
      // focus. A session already under way goes straight back to its focus view.
      const date = opts.date ?? todayISO();
      const s = useStore.getState().sessions[`${date}|${kind}`];
      const running = !!s && !s.endedAt;
      const isSession = kind === 'morning' || kind === 'workout';
      setReveal({ kind, date, list: isSession && !running, fromWeek: !!opts.fromWeek });
    },
    [],
  );

  // A stretch that finishes while minimized stops its sound.
  useEffect(() => {
    if (reveal?.kind === 'meditate' || reveal?.kind === 'morning') return;
    if (activeKind !== 'morning') stopAmbient();
  }, [activeKind, reveal?.kind]);
  const close = () => window.history.back();

  const toggleMusic = () => {
    if (music) stopAmbient();
    else startAmbient();
    setSettings({ music: !music });
  };

  const goTo = (i) => {
    const el = pagerRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  const settleRef = useRef(0);
  const onPagerScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== page) setPage(i);
    // Once scrolling stops, make sure a page sits exactly in view (iOS can
    // leave it a few pixels off after a layout change).
    clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const target = Math.round(el.scrollLeft / el.clientWidth) * el.clientWidth;
      if (Math.abs(el.scrollLeft - target) > 1) el.scrollTo({ left: target, behavior: 'smooth' });
    }, 140);
  };

  // Keep the current page aligned when the pager's size changes (rotation, island).
  useEffect(() => {
    const el = pagerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      el.scrollLeft = Math.round(el.scrollLeft / el.clientWidth) * el.clientWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Away from Today the sky folds into a slim band so lists get the room.
  const skyH = page === 0 ? 'var(--sky-h)' : 'var(--sky-band)';
  const greeting = `${greetingFor(slot)}${name ? `, ${name}` : ''}.`;

  return (
    <div className="app-h relative mx-auto max-w-md overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 z-20 overflow-hidden"
        style={{ height: reveal ? '100%' : skyH, transition: 'height 700ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        <Sky sky={sky} />
        <div
          className="absolute inset-x-6 bottom-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            top: 'env(safe-area-inset-top)',
            color: sky.ink,
            opacity: reveal || page !== 0 ? 0 : 1,
          }}
        >
          <p className="greeting max-w-[320px] text-center font-light leading-[1.2] tracking-tight">
            {greeting}
            <br />
            <span key={phrase} className="phrase-in inline-block">
              {phrase}
            </span>
          </p>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{ top: skyH, transition: 'top 700ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        aria-hidden={!!reveal}
      >
        <nav className="flex shrink-0 justify-center gap-1 px-2 pt-1" style={{ background: 'var(--bg)' }}>
          {PAGES.map((label, i) => (
            <button
              key={label}
              onClick={() => goTo(i)}
              aria-current={page === i ? 'page' : undefined}
              className="label min-h-[44px] px-3 text-[10px]"
              style={{ color: page === i ? 'var(--text-1)' : 'var(--text-3)' }}
            >
              <span className="pb-[3px]" style={{ borderBottom: `1px solid ${page === i ? 'var(--text-1)' : 'transparent'}` }}>
                {label}
              </span>
            </button>
          ))}
        </nav>
        <div ref={pagerRef} onScroll={onPagerScroll} className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden">
          <section aria-label="Today" className="today-fit h-full w-full shrink-0 snap-start overflow-hidden px-5">
            <TodayScreen now={now} sky={sky} onOpen={(kind) => open(kind)} />
          </section>
          <section aria-label="Plans" className="no-scrollbar h-full w-full shrink-0 snap-start space-y-6 overflow-y-auto px-5 pb-6 pt-5">
            <WeekScreen
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenSession={(date, kind) => open(kind, { date, fromWeek: true })}
            />
            <GoalsSection />
            <PlansScreen />
          </section>
          <section aria-label="Progress" className="no-scrollbar h-full w-full shrink-0 snap-start overflow-y-auto px-5 pb-6 pt-5">
            <ProgressScreen />
          </section>
          <section aria-label="Settings" className="no-scrollbar h-full w-full shrink-0 snap-start overflow-y-auto px-5 pb-6 pt-5">
            <SettingsScreen />
          </section>
        </div>

        {!reveal && hasTimer && !activeKind && <TimerBar now={now} />}
        <div style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))', background: 'var(--bg)' }}>
          {!reveal && <SessionIsland now={now} onOpen={(kind, date) => open(kind, { date })} />}
        </div>
      </div>

      {reveal && (
        <RevealOverlay
          key={`${reveal.kind}|${reveal.date}`}
          reveal={reveal}
          sky={sky}
          now={now}
          music={music}
          onToggleMusic={toggleMusic}
          onClose={close}
          onShowList={() => setReveal((r) => ({ ...r, list: true }))}
          onFocus={(extra = {}) => setReveal((r) => ({ ...r, list: false, ...extra }))}
        />
      )}
    </div>
  );
}
