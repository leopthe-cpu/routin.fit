// Weights are stored with the unit they were entered in and converted only for
// display, so switching units never drifts a saved number.

export const KG_PER_LB = 0.45359237;

export function convert(value, from, to) {
  if (value == null || from === to) return value;
  return from === 'kg' ? value / KG_PER_LB : value * KG_PER_LB;
}

/** Smallest sensible change on the stepper: 0.5 kg or 1 lb. */
export const STEP = { kg: 0.5, lb: 1 };

/** Typical dumbbell/plate jumps, used to round suggestions down to something that exists. */
export const JUMP = { kg: 2, lb: 5 };

export function roundTo(value, step) {
  return Math.round(value / step) * step;
}

export function floorTo(value, step) {
  return Math.floor(value / step + 1e-9) * step;
}

/** A stored { value, unit } shown in `unit`, rounded for reading. */
export function displayWeight(weight, unit) {
  if (!weight) return null;
  const v = convert(weight.value, weight.unit, unit);
  return roundTo(v, unit === 'kg' ? 0.5 : 1);
}

export function formatWeight(value, unit) {
  if (value == null) return '';
  const s = Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  return `${s} ${unit}`;
}
