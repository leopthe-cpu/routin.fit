import { useEffect, useState } from 'react';

/**
 * The current time, refreshed every `ms` (and when the app comes back to the
 * foreground). Each component asks for the pace it needs, so a fast timer
 * redraws only itself instead of the whole app.
 */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [ms]);
  return now;
}
