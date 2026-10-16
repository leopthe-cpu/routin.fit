// Ordering for the focus views: which set comes next, and which cue to show.

import { toBlocks } from './estimate';

/**
 * The next set to do. Single exercises run set after set; supersets alternate
 * between partners round by round. Returns null when every set is ticked.
 */
export function nextSet(exercises, done = {}) {
  for (const block of toBlocks(exercises)) {
    const rounds = Math.max(...block.exercises.map((e) => e.sets));
    for (let r = 0; r < rounds; r++) {
      for (const ex of block.exercises) {
        if (r < ex.sets && !done[ex.id]?.includes(r)) {
          return { ex, setIndex: r, index: exercises.indexOf(ex) };
        }
      }
    }
  }
  return null;
}

/** The cue for a move at a point in its timer (0 → 1). Unknown moves get a generic cue. */
export function cueAt(stretch, fraction) {
  const cues = stretch?.cues;
  if (!cues?.length) return 'Move slowly and keep breathing.';
  const i = Math.min(cues.length - 1, Math.max(0, Math.floor(fraction * cues.length)));
  return cues[i];
}
