import { useMemo } from 'react';
import { useStore } from '../store';

/** Every weight the user has: saved working weights plus the latest imported ones. */
export function useKnownWeights() {
  const weights = useStore((s) => s.weights);
  const history = useStore((s) => s.history);
  return useMemo(() => {
    const latest = new Map();
    for (const h of history) {
      const top = h.sets.reduce((m, w) => (m && m.value >= w.value ? m : w), null);
      if (top && (!latest.has(h.key) || latest.get(h.key).date < h.date)) {
        latest.set(h.key, { key: h.key, weight: top, date: h.date });
      }
    }
    for (const [key, w] of Object.entries(weights)) {
      latest.set(key, { key, weight: w, date: w.updatedAt?.slice(0, 10) ?? '' });
    }
    return [...latest.values()];
  }, [weights, history]);
}
