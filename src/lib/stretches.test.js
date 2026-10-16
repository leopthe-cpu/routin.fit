import { describe, expect, it } from 'vitest';
import { findStretch, STRETCHES } from '../data/stretches';
import { formLinks } from './youtube';
import { morningMinutes, moveSeconds } from './morning';
import { morningCopy } from './estimate';
import { parsePlanText } from './parsePlan';
import { DEFAULT_PLAN_TEXT } from '../data/defaultPlan';

const morning = parsePlanText(DEFAULT_PLAN_TEXT).days.Mon.morning;

describe('morning routine', () => {
  it('no longer contains the vague flow move and every move has details', () => {
    expect(morning.items.some((i) => /hyper-mobility/i.test(i))).toBe(false);
    for (const item of morning.items) expect(findStretch(item)).not.toBeNull();
  });
  it('times moves from their details', () => {
    expect(moveSeconds(morning, 0)).toBe(75);
    expect(morningMinutes(morning)).toBe(5);
    expect(morningCopy(morning).detail).toBe('4 moves · 60–75 s each · 1 with a halfway switch');
  });
  it('gives every stretch a description, a benefit and a specific search', () => {
    for (const s of STRETCHES) {
      expect(s.what.length).toBeGreaterThan(20);
      expect(s.benefit.length).toBeGreaterThan(20);
      expect(s.youtube.split(' ').length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('formLinks', () => {
  it('uses the stretch query for known stretches', () => {
    expect(formLinks('cat-cow stretch')[0].url).toContain('cat%20cow%20stretch%20proper%20form');
  });
  it('splits lines naming two moves and drops bracketed notes', () => {
    const links = formLinks('Dead Hangs & Scapular Pull-Ups');
    expect(links.map((l) => l.label)).toEqual(['Dead Hangs', 'Scapular Pull-Ups']);
    expect(formLinks('Face Pulls (or Banded/Cable Rear Delt Pulls)')[0].url).toContain('Face%20Pulls%20proper%20form%20tutorial');
  });
});
