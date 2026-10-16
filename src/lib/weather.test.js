import { describe, expect, it } from 'vitest';
import { describeCode, parseWeather, roundCoord, weatherUrl } from './weather';
import { pickPhrase, slotFor } from './sky';

describe('weather', () => {
  it('maps WMO codes to labels and icons', () => {
    expect(describeCode(0)).toEqual({ label: 'Clear', icon: 'sun' });
    expect(describeCode(0, false)).toEqual({ label: 'Clear', icon: 'moon' });
    expect(describeCode(63).label).toBe('Rain');
    expect(describeCode(95).icon).toBe('storm');
    expect(describeCode(1234).label).toBe('—');
  });

  it('rounds coordinates to about a kilometre', () => {
    expect(roundCoord(52.520008)).toBe(52.52);
    expect(weatherUrl(52.520008, 13.404954)).toContain('latitude=52.52&longitude=13.4&');
    expect(weatherUrl(1, 2, 'fahrenheit')).toContain('temperature_unit=fahrenheit');
  });

  it('parses the current block and rejects odd responses', () => {
    expect(parseWeather({ current: { temperature_2m: 14.6, weather_code: 2, is_day: 1 } })).toEqual({
      temp: 15,
      label: 'Partly cloudy',
      icon: 'cloudsun',
    });
    expect(parseWeather({})).toBeNull();
    expect(parseWeather({ current: { temperature_2m: 'x' } })).toBeNull();
  });
});

describe('sky', () => {
  it('picks the slot by hour', () => {
    expect([4, 5, 7, 11, 15, 18, 23].map(slotFor)).toEqual([
      'evening', 'early', 'morning', 'afternoon', 'late', 'evening', 'evening',
    ]);
  });

  it('never repeats the last phrase', () => {
    expect(pickPhrase(0, () => 0)).toBe(1);
    expect(pickPhrase(3, () => 0)).toBe(0);
  });
});
