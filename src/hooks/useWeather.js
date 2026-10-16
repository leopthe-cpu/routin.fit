import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store';
import { CACHE_MS, cachedWeather, loadWeather } from '../lib/weather';

/**
 * Weather for Today. Nothing is requested until the user turns it on (which
 * triggers the browser's location prompt); after that it refreshes every 15 min.
 */
export function useWeather() {
  const enabled = useStore((s) => s.settings.weather === 'on');
  const unit = useStore((s) => s.settings.tempUnit);
  const setSettings = useStore((s) => s.setSettings);
  const [state, setState] = useState(() => ({ data: cachedWeather(unit), error: '', loading: false }));

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await loadWeather(unit);
      setState({ data, error: '', loading: false });
    } catch (e) {
      setState((s) => ({ ...s, error: e.message, loading: false }));
    }
  }, [unit]);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const id = setInterval(refresh, CACHE_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  const enable = () => setSettings({ weather: 'on' });
  return { enabled, enable, ...state };
}
