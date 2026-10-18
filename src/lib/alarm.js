// When the daily alarm goes off next, and whether it's due right now.

import { toISODate } from './dates';

function todayAt(time, now) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
}

/** "Today" or "Tomorrow" for an alarm that's on, null when it's off. */
export function nextAlarmDay(alarm, now = Date.now()) {
  if (!alarm?.on) return null;
  const rangToday = alarm.lastRang === toISODate(new Date(now));
  return !rangToday && todayAt(alarm.time, now).getTime() > now ? 'Today' : 'Tomorrow';
}

/** True in the two minutes after the alarm time, if it hasn't rung yet today. */
export function alarmDue(alarm, now = Date.now()) {
  if (!alarm?.on || alarm.lastRang === toISODate(new Date(now))) return false;
  const at = todayAt(alarm.time, now).getTime();
  return now >= at && now - at < 2 * 60 * 1000;
}

/** "6:30 am" or "06:30", following the device's clock style. */
export function formatAlarm(time) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(todayAt(time, Date.now()));
}
