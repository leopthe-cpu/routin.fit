// The exercise library at runtime: match free-text exercise names to library
// entries, and find equivalent swaps that fit the user's gym and injuries.

import data from '../data/library-core.json';
import { normalizeName, nameTokens } from './exerciseNames';

export const LIBRARY = data.exercises;
const BY_ID = new Map(LIBRARY.map((e) => [e.id, e]));
// Aliases win, then plain names; names with a parenthesised variant ("Pushups
// (Close and Wide Hand Positions)") only fill gaps, since they normalise to the
// same key as the plain exercise.
const BY_NAME = new Map();
for (const e of LIBRARY) for (const a of e.aliases) BY_NAME.set(a, e);
for (const pass of [false, true]) {
  for (const e of LIBRARY) {
    if (e.name.includes('(') !== pass) continue;
    const key = normalizeName(e.name);
    if (!BY_NAME.has(key)) BY_NAME.set(key, e);
  }
}
const TOKENS = LIBRARY.map((e) => ({ e, tokens: new Set(nameTokens(e.name)) }));

export const getExercise = (id) => BY_ID.get(id) ?? null;

const MATCH_THRESHOLD = 0.6;

/**
 * Find the library entry for a name typed in a plan.
 * @returns {{ exercise: object, score: number, method: 'exact'|'alias'|'fuzzy' } | null}
 */
export function matchExercise(name) {
  const norm = normalizeName(name);
  const direct = BY_NAME.get(norm);
  if (direct) return { exercise: direct, score: 1, method: normalizeName(direct.name) === norm ? 'exact' : 'alias' };

  const best = fuzzyMatch(nameTokens(name));
  if (best) return { ...best, method: 'fuzzy' };

  // "Dead Hangs & Scapular Pull-Ups" names two moves; fall back to the first one.
  const [first] = norm.split(/\s+(?:and|\+)\s+/);
  if (first !== norm) {
    const part = matchExercise(first);
    if (part) return { ...part, score: part.score * 0.9, method: 'fuzzy' };
  }
  return null;
}

// Equipment words matter less than movement words: "DB hammer curl" should
// find Hammer Curls rather than Preacher Hammer Dumbbell Curl.
const EQUIPMENT_WORDS = new Set(['dumbbell', 'barbell', 'cable', 'machine', 'kettlebell', 'band', 'ez-bar', 'smith', 'lever', 'leverage']);
const weight = (t) => (EQUIPMENT_WORDS.has(t) ? 0.5 : 1);

function fuzzyMatch(queryTokens) {
  const q = new Set(queryTokens);
  if (!q.size) return null;
  const qWeight = [...q].reduce((s, t) => s + weight(t), 0);
  let best = null;
  for (const { e, tokens } of TOKENS) {
    let shared = 0;
    for (const t of q) if (tokens.has(t)) shared += weight(t);
    if (!shared) continue;
    let extra = 0;
    for (const t of tokens) if (!q.has(t)) extra += EQUIPMENT_WORDS.has(t) ? 0.05 : 0.25;
    // Asked for one kind of equipment, got a different one (no equipment word is fine).
    const askedEquipment = [...q].filter((t) => EQUIPMENT_WORDS.has(t));
    const hasEquipment = [...tokens].some((t) => EQUIPMENT_WORDS.has(t));
    if (askedEquipment.length && hasEquipment && !askedEquipment.some((t) => tokens.has(t))) extra += 0.2;
    let score = shared / qWeight - extra;
    if (e.category === 'stretching') score -= 0.05;
    if (!best || score > best.score) best = { exercise: e, score };
  }
  return best && best.score >= MATCH_THRESHOLD ? { ...best, score: Math.min(1, best.score) } : null;
}

const OUTDOOR_EQUIPMENT = ['pullup_bar', 'dip_bars'];
const NEVER_ASSUMED = new Set(['other', 'specialty']);

/** Can this exercise be done with the user's setup? */
export function isAvailable(exercise, setup = {}) {
  const { gymType = 'full', equipment = [], bringsBands = false } = setup;
  const needs = exercise.equipment;
  if (needs.some((x) => NEVER_ASSUMED.has(x))) return false;
  if (gymType === 'full') return true;
  const have = new Set(gymType === 'outdoors' ? [...OUTDOOR_EQUIPMENT, ...(bringsBands ? ['band'] : [])] : equipment);
  return needs.every((x) => have.has(x));
}

/** Joints the user asked to avoid entirely. */
function avoidedJoints(injuries = []) {
  return new Set(injuries.filter((i) => i.level === 'avoid').map((i) => i.area));
}

export function isSafe(exercise, injuries) {
  const avoid = avoidedJoints(injuries);
  return !exercise.joints.some((j) => avoid.has(j));
}

/**
 * Up to `limit` equivalent exercises for `exercise`: same movement pattern and,
 * where possible, the same main muscle; available with the user's setup and
 * clear of joints they avoid. Ranked by muscle overlap, then preferences.
 */
export function findSwaps(exercise, profile = {}, limit = 3) {
  if (!exercise?.pattern) return [];
  const { setup, injuries, preference, level = 'beginner' } = profile;
  const primary = new Set(exercise.primaryMuscles);
  const levelRank = { beginner: 0, intermediate: 1, expert: 2 };

  return LIBRARY.filter(
    (e) =>
      e.id !== exercise.id &&
      e.pattern === exercise.pattern &&
      e.category !== 'stretching' &&
      isAvailable(e, setup) &&
      isSafe(e, injuries),
  )
    .map((e) => {
      let score = 0;
      const sharedPrimary = e.primaryMuscles.filter((m) => primary.has(m)).length;
      score += sharedPrimary * 3;
      if (e.mechanic && e.mechanic === exercise.mechanic) score += 1;
      if (preference && e.kind === preference) score += 1;
      if (e.lengthened === exercise.lengthened) score += 0.5;
      if ((levelRank[e.level] ?? 0) <= (levelRank[level] ?? 0)) score += 0.5;
      if (e.hasImages) score += 0.2;
      return { exercise: e, score, sharedPrimary };
    })
    .filter((s) => s.sharedPrimary > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .slice(0, limit);
}
