import { describe, expect, it } from 'vitest';
import { alarmDue, nextAlarmDay } from './alarm';

const at = (h, m) => new Date(2026, 9, 19, h, m).getTime();

describe('alarm', () => {
  it('says today before the time and tomorrow after it', () => {
    const alarm = { time: '06:30', on: true, lastRang: null };
    expect(nextAlarmDay(alarm, at(5, 0))).toBe('Today');
    expect(nextAlarmDay(alarm, at(7, 0))).toBe('Tomorrow');
    expect(nextAlarmDay({ ...alarm, on: false }, at(5, 0))).toBeNull();
  });

  it('is due for two minutes, once a day', () => {
    const alarm = { time: '06:30', on: true, lastRang: null };
    expect(alarmDue(alarm, at(6, 29))).toBe(false);
    expect(alarmDue(alarm, at(6, 31))).toBe(true);
    expect(alarmDue(alarm, at(6, 33))).toBe(false);
    expect(alarmDue({ ...alarm, lastRang: '2026-10-19' }, at(6, 31))).toBe(false);
  });
});
