// Events beside the weekly plan: games, runs, rides and anything else with a
// date. Also reads a pasted schedule (for example a league's fixture list)
// into dated events, and lays plan days and events out for the calendar.
import { Activity, Bike, Dumbbell, Footprints, Mountain, PersonStanding, Shirt, Sun, Waves } from 'lucide-react';
import { sessionKey, sessionStatus } from '../store';
import { dayKeyOf, fromISODate, toISODate } from './dates';

/** Kinds of event a person can add, in picker order. */
export const EVENT_KINDS = [
  { id: 'soccer', label: 'Soccer', plural: 'Soccer', icon: Shirt },
  { id: 'run', label: 'Run', plural: 'Runs', icon: Footprints },
  { id: 'ride', label: 'Ride', plural: 'Rides', icon: Bike },
  { id: 'swim', label: 'Swim', plural: 'Swims', icon: Waves },
  { id: 'hike', label: 'Hike', plural: 'Hikes', icon: Mountain },
  { id: 'gym', label: 'Gym', plural: 'Gym', icon: Dumbbell },
  { id: 'yoga', label: 'Yoga', plural: 'Yoga', icon: PersonStanding },
  { id: 'other', label: 'Other', plural: 'Other', icon: Activity },
];

/** Every kind the calendar can show: the plan's own two first, then events. */
export const CALENDAR_KINDS = [
  { id: 'stretch', label: 'Stretch', plural: 'Stretches', icon: Sun },
  { id: 'workout', label: 'Workout', plural: 'Workouts', icon: Dumbbell },
  ...EVENT_KINDS,
];

export const kindInfo = (id) => CALENDAR_KINDS.find((k) => k.id === id) ?? CALENDAR_KINDS.at(-1);

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// Whole month names or their usual short forms, so words like "Market" don't read as March.
const MON = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?(?![a-z])';
const DAY_MONTH = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MON}(?:,?\\s+(\\d{4}))?`, 'i');
const MONTH_DAY = new RegExp(`\\b${MON}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?`, 'i');
const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const TIME_12 = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const TIME_24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;

/** The year that puts a day-and-month closest ahead: up to two months back, else forward. */
function guessYear(month, day, now) {
  const base = new Date(now);
  const earliest = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 60);
  for (const y of [base.getFullYear() - 1, base.getFullYear(), base.getFullYear() + 1]) {
    const d = new Date(y, month, day);
    if (d >= earliest) return y;
  }
  return base.getFullYear();
}

/** A date written somewhere in a line, as 'YYYY-MM-DD', or null. */
export function findDate(line, now = Date.now()) {
  let m = line.match(ISO);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  let day;
  let month;
  let year;
  if ((m = line.match(DAY_MONTH))) [day, month, year] = [Number(m[1]), MONTHS.indexOf(m[2].toLowerCase().slice(0, 3)), m[3]];
  else if ((m = line.match(MONTH_DAY))) [month, day, year] = [MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)), Number(m[2]), m[3]];
  else return null;
  if (day < 1 || day > 31) return null;
  const y = year ? Number(year) : guessYear(month, day, now);
  const d = new Date(y, month, day);
  return d.getMonth() === month ? toISODate(d) : null;
}

/** A time written in a line, as 24-hour 'HH:MM', or null. */
export function findTime(line) {
  let m = line.match(TIME_12);
  if (m) {
    const h = (Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0);
    return `${String(h).padStart(2, '0')}:${m[2] ?? '00'}`;
  }
  m = line.match(TIME_24);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

/**
 * Reads a pasted schedule into events: each date starts a new one, and the
 * lines (or table cells) after it, up to the next date, become its details.
 * Returns [{ date, time, details: [string] }], in the order written.
 */
export function parseSchedule(text, now = Date.now()) {
  const out = [];
  const cells = text
    .split(/\r?\n|\t/)
    .map((c) => c.trim())
    .filter(Boolean);
  for (const cell of cells) {
    const date = findDate(cell, now);
    if (date) {
      out.push({ date, time: findTime(cell), details: [] });
      continue;
    }
    const current = out.at(-1);
    if (!current) continue;
    if (!current.time && findTime(cell) && cell.length <= 12) {
      current.time = findTime(cell);
      continue;
    }
    current.details.push(cell);
  }
  return out;
}

/** "20:00" -> "8:00pm" (or the phone's own style). */
export function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const byTime = (a, b) => (a.time ?? '99').localeCompare(b.time ?? '99');

/**
 * What happens on each of `isos`: the active plan's stretch and workout
 * (from the plan's start date on, with how each went) and any events.
 * Returns { [iso]: [{ id, kind, title, time, place, note, status, eventId? }] }.
 */
export function calendarItems({ plan, sessions, events }, isos) {
  const out = {};
  for (const iso of isos) {
    const items = [];
    const day = plan && iso >= plan.startDate ? plan.days[dayKeyOf(fromISODate(iso))] : null;
    if (day?.morning) {
      items.push({ id: `${iso}|morning`, kind: 'stretch', title: 'Morning stretches', status: sessionStatus(sessions[sessionKey(iso, 'morning')]) });
    }
    if (day?.exercises.length) {
      items.push({ id: `${iso}|workout`, kind: 'workout', title: day.title || 'Workout', status: sessionStatus(sessions[sessionKey(iso, 'workout')]) });
    }
    const theirs = events.filter((e) => e.date === iso).sort(byTime);
    for (const e of theirs) items.push({ id: e.id, eventId: e.id, kind: e.kind, title: e.title, time: e.time, place: e.place, note: e.note });
    out[iso] = items;
  }
  return out;
}

/** The kinds that appear in a set of calendar items, in picker order: the filter only offers what's there. */
export function kindsIn(itemsByDay) {
  const seen = new Set(Object.values(itemsByDay).flatMap((items) => items.map((i) => i.kind)));
  return CALENDAR_KINDS.filter((k) => seen.has(k.id));
}

/** The six-week grid (Monday first) that shows the month of `iso`. */
export function monthGrid(iso) {
  const d = fromISODate(iso);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return { iso: toISODate(day), date: day, inMonth: day.getMonth() === first.getMonth() };
  });
}

let counter = 0;
export const eventId = () => `ev_${Date.now().toString(36)}_${(counter++).toString(36)}`;
