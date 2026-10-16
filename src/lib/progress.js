// Turns imported history and logged sessions into per-exercise series and a few
// plan-level stats for the Progress screen.

import { exerciseKey } from './weights';
import { getExercise } from './library';
import { convert } from './units';
import { weekDates, toISODate, fromISODate } from './dates';

/** All logged sets as { date, key, name, kg[] }, newest last. */
export function workoutLog({ history, sessions }) {
  const entries = history.map((h) => ({
    date: h.date,
    key: h.key,
    name: h.name,
    kg: h.sets.map((w) => convert(w.value, w.unit, 'kg')),
  }));
  for (const s of Object.values(sessions)) {
    if (s.kind !== 'workout' || !s.loads) continue;
    for (const ex of s.snapshot.exercises) {
      const loads = Object.values(s.loads[ex.id] ?? {});
      if (!loads.length) continue;
      entries.push({
        date: s.date,
        key: exerciseKey(ex.name),
        name: ex.name,
        kg: loads.map((w) => convert(w.value, w.unit, 'kg')),
      });
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/** Per exercise: one point per date with the lightest and heaviest set. */
export function seriesByExercise(log) {
  const map = new Map();
  for (const e of log) {
    if (!e.kg.length) continue;
    const s = map.get(e.key) ?? { key: e.key, name: getExercise(e.key)?.name ?? e.name, points: [] };
    const last = s.points[s.points.length - 1];
    if (last && last.date === e.date) last.kg.push(...e.kg);
    else s.points.push({ date: e.date, kg: [...e.kg] });
    map.set(e.key, s);
  }
  for (const s of map.values()) {
    for (const p of s.points) {
      p.min = Math.min(...p.kg);
      p.max = Math.max(...p.kg);
    }
  }
  return map;
}

/** Workout dates: finished sessions plus days with imported history. */
function workoutDates({ history, sessions }) {
  const dates = new Set(history.map((h) => h.date));
  for (const s of Object.values(sessions)) if (s.kind === 'workout' && s.endedAt) dates.add(s.date);
  return [...dates].sort();
}

export function planStats(state, today = new Date()) {
  const dates = workoutDates(state);
  const week = weekDates(today).map((d) => d.iso);
  const thisWeek = dates.filter((d) => week.includes(d)).length;

  // Consecutive weeks (ending this week or last) with at least one workout.
  const weekStart = (iso) => toISODate(weekDates(fromISODate(iso))[0].date);
  const weeks = new Set(dates.map(weekStart));
  let streak = 0;
  let cursor = weekDates(today)[0].date;
  if (!weeks.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 7);
  while (weeks.has(toISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  const morning = Object.values(state.sessions).filter((s) => s.kind === 'morning' && s.endedAt).length;
  return { workouts: dates.length, thisWeek, streak, morning, firstDate: dates[0] ?? null };
}
