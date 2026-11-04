import { describe, expect, it } from 'vitest';
import { movePlanDays, parsePlanText } from './lib/parsePlan';
import { DEFAULT_PLAN_TEXT } from './data/defaultPlan';

describe('v7 plan move', () => {
  it('turns the old starter layout into the current starter plan', () => {
    // The old layout is the current plan moved back: Wed legs, Thu shoulders, Fri rest, Sat upper.
    const old = movePlanDays(DEFAULT_PLAN_TEXT, { Wed: 'Sat', Thu: 'Wed', Fri: 'Thu', Sat: 'Fri' });
    expect(parsePlanText(old).days.Wed.title).toBe('Legs & Core');
    expect(movePlanDays(old, { Wed: 'Thu', Thu: 'Fri', Fri: 'Sat', Sat: 'Wed' })).toBe(DEFAULT_PLAN_TEXT);
  });
});
