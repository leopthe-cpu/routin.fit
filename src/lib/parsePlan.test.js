import { describe, expect, it } from 'vitest';
import { parsePlanText, parseTarget, splitTopLevel, looksUnparsed } from './parsePlan';
import { estimateWorkoutMinutes, musclesFor, toBlocks } from './estimate';
import { DEFAULT_PLAN_TEXT } from '../data/defaultPlan';

describe('parsePlanText on the starter plan', () => {
  const { days, warnings, dayCount } = parsePlanText(DEFAULT_PLAN_TEXT);

  it('finds all seven days with no stray lines', () => {
    expect(dayCount).toBe(7);
    expect(warnings).toEqual([]);
  });

  it('marks rest days', () => {
    expect(['Wed', 'Sat', 'Sun'].every((d) => days[d].isRest)).toBe(true);
    expect(days.Mon.isRest).toBe(false);
  });

  it('separates the morning routine from the workout', () => {
    expect(days.Mon.morning.minutes).toBe(5);
    expect(days.Mon.morning.items).toHaveLength(5);
    expect(days.Mon.morning.items[4]).toBe('shoulder pass-throughs (with band/stick)');
    expect(days.Mon.exercises).toHaveLength(6);
    expect(days.Wed.morning.items).toHaveLength(5);
  });

  it('keeps rest-day guidance as notes', () => {
    expect(days.Sat.notes).toHaveLength(3);
    expect(days.Sat.notes[0]).toMatch(/^Active Recovery/);
  });

  it('splits the superset into a pair', () => {
    const pair = days.Fri.exercises.filter((e) => e.supersetGroup);
    expect(pair.map((e) => e.name)).toEqual(['Standing Hammer Curls', 'Dumbbell Kickbacks']);
    expect(pair.every((e) => e.sets === 3 && e.target.label === '10-12')).toBe(true);
    expect(toBlocks(days.Fri.exercises)).toHaveLength(7);
  });

  it('reads holds, failure sets and notes', () => {
    const hang = days.Fri.exercises.find((e) => e.name.startsWith('Dead Hangs'));
    expect(hang.target).toMatchObject({ kind: 'hold', min: 30, max: 45 });
    expect(hang.note).toBe('Gym only');
    const neck = days.Fri.exercises.find((e) => e.name === 'Neck Bridges');
    expect(neck.sets).toBe(2);
    expect(neck.note).toMatch(/Careful execution/);
    const legRaise = days.Thu.exercises.find((e) => e.name === 'Lying Leg Raises');
    expect(legRaise.target.kind).toBe('failure');
    expect(days.Fri.exercises.find((e) => e.name === 'Face Pulls').note).toBe(
      'or Banded/Cable Rear Delt Pulls',
    );
  });

  it('estimates a sensible session length', () => {
    const mins = estimateWorkoutMinutes(days.Mon.exercises);
    expect(mins).toBeGreaterThanOrEqual(30);
    expect(mins).toBeLessThanOrEqual(60);
  });

  it('names the muscles worked', () => {
    expect(musclesFor(days.Mon.exercises)).toEqual(['chest', 'biceps', 'core']);
    expect(musclesFor(days.Tue.exercises)).toEqual(['back', 'rear delts', 'traps', 'core']);
  });
});

describe('helpers', () => {
  it('splits commas outside parentheses only', () => {
    expect(splitTopLevel('a, b (x, y), c.')).toEqual(['a', 'b (x, y)', 'c']);
  });
  it('parses targets', () => {
    expect(parseTarget('6-8')).toMatchObject({ kind: 'reps', min: 6, max: 8 });
    expect(parseTarget('Failure')).toMatchObject({ kind: 'failure' });
    expect(parseTarget('12')).toMatchObject({ min: 12, max: 12 });
  });
  it('accepts full day names and flags text it cannot read', () => {
    const r = parsePlanText('Monday - Legs\n- Goblet Squat: 4x10');
    expect(r.days.Mon.exercises[0].name).toBe('Goblet Squat');
    expect(looksUnparsed(r)).toBe(false);
    expect(looksUnparsed(parsePlanText('do some pushups every morning'))).toBe(true);
  });
});
