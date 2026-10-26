import { describe, expect, it } from 'vitest';
import { calendarItems, findDate, findTime, kindsIn, monthGrid, parseSchedule } from './events';

const now = new Date(2026, 9, 26).getTime(); // Mon 26 Oct 2026

describe('findDate', () => {
  it('reads day-month, month-day and ISO dates', () => {
    expect(findDate('Wed 28 Oct @ 8:00pm', now)).toBe('2026-10-28');
    expect(findDate('November 11th, 7pm', now)).toBe('2026-11-11');
    expect(findDate('2027-02-03 long run', now)).toBe('2027-02-03');
  });
  it('rolls into next year for early months, but keeps recent past dates', () => {
    expect(findDate('Wed 6 Jan', now)).toBe('2027-01-06');
    expect(findDate('1 Oct', now)).toBe('2026-10-01');
  });
  it('ignores words that only look like months', () => {
    expect(findDate('Market 5', now)).toBeNull();
    expect(findDate('Central Tech (4)', now)).toBeNull();
  });
});

describe('findTime', () => {
  it('reads 12- and 24-hour times', () => {
    expect(findTime('@ 8:00pm')).toBe('20:00');
    expect(findTime('11pm')).toBe('23:00');
    expect(findTime('12:30am')).toBe('00:30');
    expect(findTime('07:15')).toBe('07:15');
    expect(findTime('League Game')).toBeNull();
  });
});

describe('parseSchedule', () => {
  it('turns a copied fixture table into dated events with their details', () => {
    const text = [
      'Date, Time + Location\tTeams\tMy Status',
      'Wed 28 Oct @ 8:00pm',
      'Central Tech (4)',
      'League Game\tOlympique DG',
      'Charlie Wonderland\tNot Entered',
      'Wed 11 Nov @ 11:00pm',
      'Central Tech (2)',
    ].join('\n');
    expect(parseSchedule(text, now)).toEqual([
      { date: '2026-10-28', time: '20:00', details: ['Central Tech (4)', 'League Game', 'Olympique DG', 'Charlie Wonderland', 'Not Entered'] },
      { date: '2026-11-11', time: '23:00', details: ['Central Tech (2)'] },
    ]);
  });
  it('picks up a time written on the line after the date', () => {
    expect(parseSchedule('Sat 31 Oct\n7:30am\nRiver loop', now)).toEqual([{ date: '2026-10-31', time: '07:30', details: ['River loop'] }]);
  });
});

describe('calendar', () => {
  const plan = {
    startDate: '2026-10-19',
    days: {
      Mon: { morning: { items: [] }, exercises: [{ id: 'a' }], title: 'Legs' },
      Tue: { morning: null, exercises: [], title: '' },
      Wed: { morning: { items: [] }, exercises: [], title: '' },
      Thu: { morning: null, exercises: [], title: '' },
      Fri: { morning: null, exercises: [], title: '' },
      Sat: { morning: null, exercises: [], title: '' },
      Sun: { morning: null, exercises: [], title: '' },
    },
  };
  const events = [
    { id: 'e2', kind: 'soccer', title: 'Late game', date: '2026-10-28', time: '22:00' },
    { id: 'e1', kind: 'run', title: 'Easy run', date: '2026-10-28', time: '07:00' },
  ];

  it('lists plan sessions and events per day, events by time', () => {
    const items = calendarItems({ plan, sessions: {}, events }, ['2026-10-12', '2026-10-26', '2026-10-28']);
    expect(items['2026-10-12']).toEqual([]); // before the plan started
    expect(items['2026-10-26'].map((i) => i.kind)).toEqual(['stretch', 'workout']);
    expect(items['2026-10-28'].map((i) => i.title)).toEqual(['Morning stretches', 'Easy run', 'Late game']);
    expect(kindsIn(items).map((k) => k.id)).toEqual(['stretch', 'workout', 'soccer', 'run']);
  });

  it('builds a Monday-first six-week month grid', () => {
    const grid = monthGrid('2026-10-26');
    expect(grid).toHaveLength(42);
    expect(grid[0].iso).toBe('2026-09-28');
    expect(grid.filter((d) => d.inMonth)).toHaveLength(31);
  });
});
