import { describe, expect, it } from 'vitest';
import { LIBRARY, matchExercise, findSwaps, isAvailable, isSafe, getExercise } from './library';
import { parsePlanText } from './parsePlan';
import { DEFAULT_PLAN_TEXT } from '../data/defaultPlan';

describe('library data', () => {
  it('has unique ids and the fields the app relies on', () => {
    expect(new Set(LIBRARY.map((e) => e.id)).size).toBe(LIBRARY.length);
    for (const e of LIBRARY) {
      expect(Array.isArray(e.equipment)).toBe(true);
      expect(Array.isArray(e.joints)).toBe(true);
      expect(e.primaryMuscles.length).toBeGreaterThan(0);
    }
  });
  it('splits shoulders into deltoid heads', () => {
    expect(getExercise('Side_Lateral_Raise').primaryMuscles).toEqual(['side_delts']);
    expect(getExercise('Face_Pull').primaryMuscles).toContain('rear_delts');
    expect(LIBRARY.some((e) => e.primaryMuscles.includes('shoulders'))).toBe(false);
  });
});

describe('matchExercise', () => {
  it('matches every exercise in the starter plan', () => {
    const { days } = parsePlanText(DEFAULT_PLAN_TEXT);
    const names = Object.values(days).flatMap((d) => d.exercises.map((e) => e.name));
    const missing = names.filter((n) => !matchExercise(n));
    expect(missing).toEqual([]);
  });
  it('uses aliases and tolerates plurals and abbreviations', () => {
    expect(matchExercise('Flat Dumbbell Bench Press').exercise.id).toBe('Dumbbell_Bench_Press');
    expect(matchExercise('DB hammer curls').exercise.id).toBe('Hammer_Curls');
    expect(matchExercise('pullups').exercise.id).toBe('Pullups');
  });
  it('returns null for text that is not an exercise', () => {
    expect(matchExercise('Focus on recovery and hydration')).toBeNull();
  });
});

describe('availability and safety', () => {
  const bench = getExercise('Dumbbell_Bench_Press');
  it('checks home equipment and outdoor setups', () => {
    expect(isAvailable(bench, { gymType: 'full' })).toBe(true);
    expect(isAvailable(bench, { gymType: 'home', equipment: ['dumbbell'] })).toBe(false);
    expect(isAvailable(bench, { gymType: 'home', equipment: ['dumbbell', 'bench'] })).toBe(true);
    expect(isAvailable(bench, { gymType: 'outdoors' })).toBe(false);
    expect(isAvailable(getExercise('Pullups'), { gymType: 'outdoors' })).toBe(true);
  });
  it('filters out exercises loading an avoided joint', () => {
    expect(isSafe(bench, [{ area: 'shoulder', level: 'avoid' }])).toBe(false);
    expect(isSafe(bench, [{ area: 'shoulder', level: 'go_easy' }])).toBe(true);
  });
});

describe('findSwaps', () => {
  it('suggests same-pattern, same-muscle exercises that fit the setup', () => {
    const swaps = findSwaps(getExercise('Face_Pull'), {
      setup: { gymType: 'home', equipment: ['dumbbell', 'bench', 'band'] },
    });
    expect(swaps.length).toBeGreaterThan(0);
    for (const { exercise } of swaps) {
      expect(exercise.pattern).toBe('rear_delt');
      expect(exercise.equipment.every((x) => ['dumbbell', 'bench', 'band'].includes(x))).toBe(true);
    }
  });
  it('prefers machines when asked', () => {
    const [first] = findSwaps(bench(), { preference: 'machine' });
    expect(first.exercise.kind).toBe('machine');
    function bench() {
      return getExercise('Dumbbell_Bench_Press');
    }
  });
  it('offers bodyweight options outdoors', () => {
    const swaps = findSwaps(getExercise('One-Arm_Dumbbell_Row'), { setup: { gymType: 'outdoors' } });
    expect(swaps.map((s) => s.exercise.id)).toContain('Inverted_Row');
  });
});
