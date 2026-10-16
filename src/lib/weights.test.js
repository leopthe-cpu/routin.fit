import { describe, expect, it } from 'vitest';
import { exerciseKey, isBodyweight, suggestWeight } from './weights';
import { convert, displayWeight } from './units';
import { workoutLog, seriesByExercise, planStats } from './progress';

const known = (key, value, date, unit = 'kg') => ({ key, weight: { value, unit }, date });

describe('units', () => {
  it('converts and displays without drifting the stored value', () => {
    expect(convert(10, 'kg', 'lb')).toBeCloseTo(22.046, 2);
    expect(displayWeight({ value: 20, unit: 'kg' }, 'lb')).toBe(44);
    expect(displayWeight({ value: 45, unit: 'lb' }, 'lb')).toBe(45);
  });
});

describe('suggestWeight', () => {
  it('prefers the user’s own older number, eased back', () => {
    const s = suggestWeight('Dumbbell Floor Press', [known('Dumbbell_Floor_Press', 14, '2026-04-10')], 'kg');
    expect(s).toMatchObject({ own: true, value: 10 });
  });
  it('borrows from the same movement and muscle, rounding down', () => {
    const s = suggestWeight('Chest-Supported Dumbbell Rows', [known('One-Arm_Dumbbell_Row', 26.5, '2026-10-15')], 'kg');
    expect(s.basedOn).toBe('One-Arm Dumbbell Row');
    expect(s.value).toBeLessThan(26.5);
    expect(s.value % 2).toBe(0);
  });
  it('compares barbell with barbell before dumbbells', () => {
    const s = suggestWeight(
      'Standing EZ-Bar Curls',
      [known('Hammer_Curls', 15.5, '2026-10-15'), known('Barbell_Curl', 20, '2026-09-14')],
      'kg',
    );
    expect(s.basedOn).toBe('Barbell Curl');
    expect(s.value).toBeLessThanOrEqual(20);
  });
  it('works in pounds', () => {
    const s = suggestWeight('Chest-Supported Dumbbell Rows', [known('One-Arm_Dumbbell_Row', 60, '2026-10-15', 'lb')], 'lb');
    expect(s.unit).toBe('lb');
    expect(s.value % 5).toBe(0);
  });
  it('returns nothing for bodyweight moves or without related data', () => {
    expect(isBodyweight('Hanging Leg Raises')).toBe(true);
    expect(suggestWeight('Hanging Leg Raises', [known('Dumbbell_Bench_Press', 40, '2026-10-01')], 'kg')).toBeNull();
    expect(suggestWeight('Dumbbell Lateral Raises', [], 'kg')).toBeNull();
  });
  it('gives stable keys for different spellings', () => {
    expect(exerciseKey('Flat Dumbbell Bench Press')).toBe(exerciseKey('dumbbell bench press'));
  });
});

describe('progress', () => {
  const state = {
    history: [
      { date: '2026-10-01', key: 'Hammer_Curls', name: 'Hammer Curls', sets: [{ value: 12.5, unit: 'kg' }, { value: 15, unit: 'kg' }] },
      { date: '2026-10-08', key: 'Hammer_Curls', name: 'Hammer Curls', sets: [{ value: 15.5, unit: 'kg' }] },
    ],
    sessions: {
      '2026-10-15|workout': {
        kind: 'workout', date: '2026-10-15', endedAt: '2026-10-15T18:00:00Z',
        snapshot: { exercises: [{ id: 'Fri-2a', name: 'Standing Hammer Curls', sets: 3 }] },
        loads: { 'Fri-2a': { 0: { value: 16, unit: 'kg' }, 1: { value: 17, unit: 'kg' } } },
      },
    },
  };
  it('merges history and logged sessions per exercise', () => {
    const s = seriesByExercise(workoutLog(state)).get('Hammer_Curls');
    expect(s.points.map((p) => [p.date, p.min, p.max])).toEqual([
      ['2026-10-01', 12.5, 15],
      ['2026-10-08', 15.5, 15.5],
      ['2026-10-15', 16, 17],
    ]);
  });
  it('counts workouts and the weekly streak', () => {
    const stats = planStats(state, new Date(2026, 9, 16));
    expect(stats.workouts).toBe(3);
    expect(stats.thisWeek).toBe(1);
    expect(stats.streak).toBe(3);
  });
});
