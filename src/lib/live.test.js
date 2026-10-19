import { describe, expect, it } from 'vitest';
import { liveSummary } from './live';

const session = {
  key: '2026-10-19|workout',
  kind: 'workout',
  date: '2026-10-19',
  startedAt: new Date(1_000_000).toISOString(),
  snapshot: { title: 'Upper Body', exercises: [{ id: 'a', name: 'Press', sets: 4 }] },
  done: { a: [0] },
};

describe('liveSummary', () => {
  it('is empty when nothing runs', () => {
    expect(liveSummary({ active: null, timer: null, meditation: null })).toBeNull();
  });

  it('counts a workout up from its start', () => {
    const live = liveSummary({ active: session, timer: null, meditation: null }, 1_060_000);
    expect(live).toMatchObject({ kind: 'workout', title: 'Upper Body', status: '1 of 4 sets', countsDown: false, startedAt: 1_000_000, seconds: 60 });
    expect(live.fraction).toBe(0.25);
  });

  it('counts a rest down to its end, and holds still when paused', () => {
    const timer = { endsAt: 1_090_000, total: 90, label: 'Rest', sessionKey: session.key };
    expect(liveSummary({ active: session, timer }, 1_060_000)).toMatchObject({ status: 'Rest', countsDown: true, endsAt: 1_090_000, seconds: 30 });
    const paused = liveSummary({ active: session, timer: { ...timer, pausedAt: 1_070_000 } }, 1_080_000);
    expect(paused).toMatchObject({ paused: true, status: 'Rest · paused', seconds: 20 });
  });

  it('ignores an ended session', () => {
    expect(liveSummary({ active: { ...session, endedAt: 'x' }, timer: null, meditation: null })).toBeNull();
  });
});
