// Today's numbers, shared by the Today screen and the iPhone widgets.
import { sessionKey, sessionProgress } from '../store';
import { weekDates } from './dates';

/** Share of this week's planned stretches and workouts that were done (ended with at least one tick). */
export function weekProgress(plan, sessions, now) {
  let planned = 0;
  let workouts = 0;
  let stretches = 0;
  for (const w of weekDates(new Date(now))) {
    const day = plan.days[w.key];
    const counted = (kind) => {
      const s = sessions[sessionKey(w.iso, kind)];
      return !!s?.endedAt && sessionProgress(s).done > 0;
    };
    if (day.morning) {
      planned++;
      if (counted('morning')) stretches++;
    }
    if (day.exercises.length) {
      planned++;
      if (counted('workout')) workouts++;
    }
  }
  return { planned, workouts, stretches, pct: planned ? Math.round(((workouts + stretches) / planned) * 100) : 0 };
}

/** The goals tile: today's goals and how many are ticked. */
export function goalsTile(goals, checks, iso, dayKey) {
  if (!goals.length) return { value: 'Add a goal', sub: 'Runs, steps, habits…', status: 'New' };
  const today = goals.filter((g) => g.days.includes(dayKey));
  if (!today.length) return { value: 'None today', sub: `${goals.length} goal${goals.length > 1 ? 's' : ''} this week`, status: 'Open' };
  const done = today.filter((g) => checks[`${iso}|${g.id}`]).length;
  const next = today.find((g) => !checks[`${iso}|${g.id}`]);
  return {
    value: next ? next.title : 'All done',
    sub: `${done} of ${today.length} today`,
    status: done === today.length ? 'Done' : 'Open',
  };
}
