// Timings for the morning routine, from each move's stretch details where known.

import { findStretch } from '../data/stretches';

/** Seconds for a morning move: from its stretch details, else an equal share of the routine. */
export function moveSeconds(morning, index) {
  const stretch = findStretch(morning.items[index]);
  if (stretch) return stretch.dose.seconds;
  return Math.max(20, Math.round((morning.minutes * 60) / morning.items.length));
}

/** Total morning-routine length in minutes, from the moves' own timings where known. */
export function morningMinutes(morning) {
  if (!morning.items.every((n) => findStretch(n))) return morning.minutes;
  const secs = morning.items.reduce((sum, _, i) => sum + moveSeconds(morning, i), 0);
  return Math.max(1, Math.ceil(secs / 60));
}
