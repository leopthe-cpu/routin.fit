// Ordering and copy for the focus views: the order sets are done in, which set
// comes next, the cue for a stretch, and the short coaching lines.

import { toBlocks } from './estimate';

/**
 * Every set of a workout in the order it is done. Single exercises run set
 * after set; supersets alternate between partners round by round.
 */
export function setSequence(exercises) {
  const seq = [];
  for (const block of toBlocks(exercises)) {
    const rounds = Math.max(...block.exercises.map((e) => e.sets));
    for (let r = 0; r < rounds; r++) {
      for (const ex of block.exercises) {
        if (r < ex.sets) seq.push({ ex, setIndex: r, index: exercises.indexOf(ex) });
      }
    }
  }
  return seq;
}

/** The first set not yet ticked, or null when every set is done. */
export function nextSet(exercises, done = {}) {
  return setSequence(exercises).find((s) => !done[s.ex.id]?.includes(s.setIndex)) ?? null;
}

/** The cue for a move at a point in its timer (0 → 1). Unknown moves get a generic cue. */
export function cueAt(stretch, fraction) {
  const cues = stretch?.cues;
  if (!cues?.length) return 'Move slowly and keep breathing.';
  const i = Math.min(cues.length - 1, Math.max(0, Math.floor(fraction * cues.length)));
  return cues[i];
}

/** A short chip label and a fuller explanation, chosen from the rep target. */
export function tipFor(ex) {
  const t = ex.target;
  if (t.kind === 'hold') {
    return {
      short: 'Brace and breathe',
      long: 'Hold still, brace your middle and keep breathing slowly through the hold.',
    };
  }
  if (t.kind === 'failure') {
    return {
      short: 'Stop when form slips',
      long: 'Keep going until your form starts to slip, then stop. The last good rep is the one that counts.',
    };
  }
  const low = t.min ?? 10;
  if (low <= 8) {
    return {
      short: 'Control the lowering',
      long: 'Heavy set: brace, lower for 2–3 seconds, and stop with 1–2 good reps left in the tank.',
    };
  }
  if (low <= 10) {
    return {
      short: 'Pause, then drive',
      long: 'Control the lowering, pause briefly at the bottom, then drive up with intent.',
    };
  }
  return {
    short: 'Smooth and steady',
    long: 'Smooth, steady reps. Keep tension on the muscle the whole way up and down.',
  };
}

export const START_PHRASES = [
  'First set. Make it a clean one.',
  'Steady breath. Let’s go.',
  'One good rep at a time.',
  'You showed up. Now enjoy it.',
  'Easy start, strong finish.',
  'Here we go. Nice and controlled.',
];

/** A start phrase that stays the same for a given session (so it doesn't flicker on re-render). */
export function startPhrase(seed) {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return START_PHRASES[h % START_PHRASES.length];
}
