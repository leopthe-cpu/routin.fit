// Which parts of the body map light up for the muscle groups a workout covers
// (the names come from musclesFor in estimate.js).

const REGIONS = {
  chest: ['f.chest'],
  shoulders: ['f.delts', 'b.delts'],
  'rear delts': ['b.delts'],
  back: ['b.lats', 'b.lowerBack', 'b.traps'],
  traps: ['b.traps', 'f.traps'],
  biceps: ['f.biceps'],
  triceps: ['b.triceps'],
  forearms: ['f.forearms', 'b.forearms'],
  core: ['f.abs'],
  legs: ['f.quads', 'f.shins', 'b.glutes', 'b.hamstrings', 'b.calves'],
  neck: ['f.neck', 'b.neck'],
  // Stretch areas (stretchAreas in estimate.js).
  hips: ['b.glutes', 'f.quads'],
  spine: ['b.lowerBack', 'b.lats'],
  'wrists & ankles': ['f.forearms', 'b.forearms', 'f.shins', 'b.calves'],
  hamstrings: ['b.hamstrings'],
};

/** Set of region ids ('f.chest', 'b.lats', …) to highlight. */
export function regionsFor(muscles) {
  const out = new Set();
  for (const m of muscles) for (const r of REGIONS[m] ?? []) out.add(r);
  return out;
}
