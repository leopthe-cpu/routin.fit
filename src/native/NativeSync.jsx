import { useEffect } from 'react';
import { useStore, sessionKey, sessionProgress, sessionStatus } from '../store';
import { dayKeyOf, toISODate } from '../lib/dates';
import { shortTitle } from '../lib/estimate';
import { liveSummary } from '../lib/live';
import { goalsTile, weekProgress } from '../lib/today';
import { allowNotifications, isNative, syncAlarm, syncLiveActivity, syncTimerAlert, syncWidgets } from '.';

const STATUS_WORD = { todo: 'To do', progress: 'Under way', done: 'Done', partial: 'Ended' };

/** The handful of facts the widgets show, worked out from the store. */
function widgetData(s, now = Date.now()) {
  const date = new Date(now);
  const iso = toISODate(date);
  const dayKey = dayKeyOf(date);
  const plan = s.activePlan();
  const day = plan?.days[dayKey];
  const status = (kind) => {
    const session = s.sessions[sessionKey(iso, kind)];
    const st = sessionStatus(session);
    if (st !== 'progress') return STATUS_WORD[st];
    const { done, total } = sessionProgress(session);
    return `${done} of ${total}`;
  };
  const goal = goalsTile(s.goals, s.goalChecks, iso, dayKey);
  const week = plan ? weekProgress(plan, s.sessions, now) : null;
  return {
    date: iso,
    name: s.settings.name || '',
    stretch: day?.morning ? { title: 'Morning flow', status: status('morning') } : null,
    workout: day?.exercises.length ? { title: shortTitle(day.title), status: status('workout') } : { title: 'Rest day', status: 'Rest' },
    goals: { title: goal.value, status: goal.sub },
    week: week ? { pct: week.pct, done: week.workouts + week.stretches, planned: week.planned } : null,
    alarm: s.alarm.on ? s.alarm.time : null,
  };
}

/** Only the parts of the live summary that change what the Live Activity shows (the phone ticks the clock itself). */
const liveKey = (live) =>
  live && JSON.stringify([live.kind, live.title, live.status, live.fraction, live.paused, live.endsAt, live.startedAt, live.paused && live.seconds]);

/**
 * Keeps the iPhone's own surfaces in step with the app: the Live Activity
 * (Lock Screen and Dynamic Island), the end-of-timer notification, the daily
 * alarm and the widgets. Draws nothing; in the browser it does nothing.
 */
export default function NativeSync() {
  useEffect(() => {
    if (!isNative) return undefined;
    let lastLive;
    let lastWidgets;
    let lastAlarm;
    let asked = false;

    const sync = (s) => {
      const live = liveSummary({ active: s.activeSessionKey ? s.sessions[s.activeSessionKey] : null, timer: s.timer, meditation: s.meditation });
      const key = liveKey(live);
      if (key !== lastLive) {
        lastLive = key;
        if (live && !asked) {
          asked = true;
          allowNotifications();
        }
        syncLiveActivity(live);
        syncTimerAlert(live);
      }
      const alarm = JSON.stringify([s.alarm.on, s.alarm.time]);
      if (alarm !== lastAlarm) {
        lastAlarm = alarm;
        syncAlarm(s.alarm);
      }
      const widgets = JSON.stringify(widgetData(s));
      if (widgets !== lastWidgets) {
        lastWidgets = widgets;
        syncWidgets(JSON.parse(widgets));
      }
    };

    sync(useStore.getState());
    const unsubscribe = useStore.subscribe(sync);
    // The date and week roll over at midnight with no store change; check now and then.
    const id = setInterval(() => sync(useStore.getState()), 60_000);
    return () => {
      unsubscribe();
      clearInterval(id);
    };
  }, []);
  return null;
}
