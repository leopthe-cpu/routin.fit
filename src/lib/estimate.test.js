import { describe, expect, it } from 'vitest';
import { shortTitle } from './estimate';
import { regionsFor } from './bodyRegions';

describe('shortTitle', () => {
  it('keeps short titles and shortens long ones', () => {
    expect(shortTitle('Chest & Biceps')).toBe('Chest & Biceps');
    expect(shortTitle('Upper Body, Forearms & Rear Delts')).toBe('Upper Body +');
    expect(shortTitle('Back, Rear Delts & Traps')).toBe('Back +');
    expect(shortTitle('Supercalifragilistic workout day')).toBe('Supercalifragil…');
  });
});

describe('regionsFor', () => {
  it('maps muscle groups to front and back regions', () => {
    const r = regionsFor(['chest', 'rear delts', 'legs']);
    expect(r.has('f.chest')).toBe(true);
    expect(r.has('b.delts')).toBe(true);
    expect(r.has('b.hamstrings')).toBe(true);
    expect(r.has('f.biceps')).toBe(false);
  });
});
