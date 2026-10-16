// Exercise weights: a stable key per exercise, and suggestions for exercises
// that have no saved weight yet, borrowed from similar exercises the user has
// already logged.
//
// The conversion factors below are rough rules of thumb, not measured ratios:
// suggestions always round DOWN and carry a 15% safety margin, and the UI says
// what each one is based on so the user can judge it.

import { matchExercise, getExercise } from './library';
import { normalizeName } from './exerciseNames';
import { convert, floorTo, JUMP } from './units';

const keyCache = new Map();

/** Library id when the name matches one, otherwise a name-based key. */
export function exerciseKey(name) {
  if (!keyCache.has(name)) {
    keyCache.set(name, matchExercise(name)?.exercise.id ?? `name:${normalizeName(name)}`);
  }
  return keyCache.get(name);
}

/** Exercises where a number on the bar or dumbbell isn't the point. */
export function isBodyweight(name) {
  const e = getExercise(exerciseKey(name));
  return !!e && e.kind === 'bodyweight';
}

// How heavy a variation is relative to a two-dumbbell version of the same movement
// (per dumbbell). Barbells carry both hands' load on one bar.
function loadFactor(e) {
  let f = 1;
  const eq = new Set(e.equipment);
  if (eq.has('barbell') || eq.has('ez_bar')) f *= 2;
  else if (eq.has('machine') || eq.has('cable')) f *= 2.5;
  const n = e.name.toLowerCase();
  if (e.pattern === 'horizontal_push') {
    if (/incline/.test(n)) f *= 0.8;
    if (/floor press/.test(n)) f *= 0.9;
    if (/squeeze/.test(n)) f *= 0.6;
  }
  if (e.pattern === 'horizontal_pull') {
    if (/one-arm|single-arm/.test(n)) f *= 1.1;
    if (/chest-supported|incline|seal/.test(n)) f *= 0.8;
  }
  if (e.pattern === 'elbow_flexion' && /incline|concentration|preacher/.test(n)) f *= 0.8;
  if (e.pattern === 'elbow_extension') {
    if (/kickback/.test(n)) f *= 0.5;
    if (/overhead/.test(n) && !/cable/.test(n)) f *= 1.5; // one dumbbell held in both hands
  }
  return f;
}

// When nothing in the same movement pattern is known, borrow from a related one.
const RELATED = {
  rear_delt: [['lateral_raise', 0.8]],
  lateral_raise: [['rear_delt', 1.1], ['vertical_push', 0.5]],
  front_raise: [['lateral_raise', 1]],
  shrug: [['horizontal_pull', 1]],
  wrist: [['elbow_flexion', 0.6]],
  pullover: [['horizontal_push', 0.5]],
  fly: [['horizontal_push', 0.45]],
  elbow_extension: [['elbow_flexion', 0.9]],
  core_rotation: [['core_flexion', 1]],
};

const SAFETY = 0.85;

/** Barbell-type, dumbbell-type or machine-type load: compare like with like first. */
function loadClass(e) {
  const eq = new Set(e.equipment);
  if (eq.has('barbell') || eq.has('ez_bar')) return 'bar';
  if (eq.has('machine') || eq.has('cable')) return 'machine';
  return 'free';
}
const WEIGHTED = (e) => e && e.kind !== 'bodyweight' && e.kind !== 'band';

/**
 * Suggest a starting weight for `name` from `known` weights.
 * @param {string} name exercise name as written in the plan
 * @param {Array<{key: string, weight: {value: number, unit: string}, date: string}>} known
 * @param {'kg'|'lb'} unit display unit
 * @returns {{ value: number, unit: string, basedOn: string, basedOnWeight: {value:number, unit:string} } | null}
 */
export function suggestWeight(name, known, unit) {
  const target = getExercise(exerciseKey(name));
  if (!WEIGHTED(target)) return null;
  const primary = new Set(target.primaryMuscles);

  const all = known.map((k) => ({ ...k, e: getExercise(k.key) })).filter((k) => WEIGHTED(k.e));

  // The user's own (older) number for this exact exercise beats any estimate.
  const own = all.filter((k) => k.e.id === target.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
  if (own) {
    const v = Math.max(JUMP[unit], floorTo(convert(own.weight.value, own.weight.unit, unit) * SAFETY, JUMP[unit]));
    return { value: v, unit, basedOn: own.e.name, basedOnWeight: own.weight, basedOnDate: own.date, own: true };
  }

  const candidates = all.filter((k) => k.e.id !== target.id);
  const cls = loadClass(target);

  const tiers = [
    (k) => (k.e.pattern === target.pattern && k.e.primaryMuscles.some((m) => primary.has(m)) ? 1 : null),
    (k) => (k.e.pattern === target.pattern ? 1 : null),
    (k) => RELATED[target.pattern]?.find(([p]) => p === k.e.pattern)?.[1] ?? null,
  ];

  for (const tier of tiers) {
    const hits = candidates
      .map((k) => ({ ...k, ratio: tier(k) }))
      .filter((k) => k.ratio != null)
      .sort(
        (a, b) =>
          (loadClass(b.e) === cls) - (loadClass(a.e) === cls) || (b.date ?? '').localeCompare(a.date ?? ''),
      );
    if (!hits.length) continue;
    const src = hits[0];
    const kg = convert(src.weight.value, src.weight.unit, 'kg');
    const estimateKg = (kg * src.ratio * loadFactor(target) * SAFETY) / loadFactor(src.e);
    const value = Math.max(JUMP[unit], floorTo(convert(estimateKg, 'kg', unit), JUMP[unit]));
    return { value, unit, basedOn: src.e.name, basedOnWeight: src.weight };
  }
  return null;
}
