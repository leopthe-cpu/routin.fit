import { DAY_KEYS } from './parsePlan';

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-first day key ('Mon'…'Sun') for a date. */
export function dayKeyOf(date) {
  return DAY_KEYS[(date.getDay() + 6) % 7];
}

/** The seven dates (Mon–Sun) of the week containing `date`, offset by whole weeks. */
export function weekDates(date = new Date(), weekOffset = 0) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + weekOffset * 7);
  return DAY_KEYS.map((key, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { key, iso: toISODate(d), date: d };
  });
}

/** 1-based week number of the plan, counted from its start date. */
export function planWeek(startISO, onISO = todayISO()) {
  const days = Math.floor((fromISODate(onISO) - fromISODate(startISO)) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}
