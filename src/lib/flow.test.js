import { describe, expect, it } from 'vitest';
import { cueAt, nextSet, setSequence, startPhrase, START_PHRASES } from './flow';

const ex = (id, sets, supersetGroup) => ({ id, name: id, sets, supersetGroup, target: { kind: 'reps', min: 8, max: 10 } });

describe('nextSet', () => {
  it('runs single exercises set by set, filling gaps first', () => {
    const list = [ex('a', 3), ex('b', 2)];
    expect(nextSet(list, {})).toMatchObject({ setIndex: 0, index: 0 });
    expect(nextSet(list, { a: [0, 2] })).toMatchObject({ setIndex: 1, index: 0 });
    expect(nextSet(list, { a: [0, 1, 2] })).toMatchObject({ setIndex: 0, index: 1 });
    expect(nextSet(list, { a: [0, 1, 2], b: [0, 1] })).toBeNull();
  });

  it('alternates superset partners each round', () => {
    const list = [ex('c', 3, 'A'), ex('d', 3, 'A')];
    expect(nextSet(list, { c: [0] }).ex.id).toBe('d');
    expect(nextSet(list, { c: [0], d: [0] })).toMatchObject({ setIndex: 1, index: 0 });
  });
});

describe('cueAt', () => {
  const s = { cues: ['one', 'two', 'three', 'four'] };
  it('walks through the cues over the timer', () => {
    expect([0, 0.3, 0.5, 0.99, 1].map((f) => cueAt(s, f))).toEqual(['one', 'two', 'three', 'four', 'four']);
    expect(cueAt(null, 0.5)).toMatch(/breathing/);
  });
});

describe('setSequence', () => {
  it('lists singles set by set and supersets round by round', () => {
    const list = [ex('a', 2), ex('c', 2, 'A'), ex('d', 2, 'A')];
    expect(setSequence(list).map((s) => `${s.ex.id}${s.setIndex}`)).toEqual(['a0', 'a1', 'c0', 'd0', 'c1', 'd1']);
  });
});

describe('startPhrase', () => {
  it('is stable for a seed', () => {
    expect(startPhrase('2026-10-17|workout')).toBe(startPhrase('2026-10-17|workout'));
    expect(START_PHRASES).toContain(startPhrase('x'));
  });
});
