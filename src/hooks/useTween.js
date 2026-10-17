import { useEffect, useRef, useState } from 'react';

/** Eases a number toward `target` over `ms`, so counters glide instead of jumping. */
export function useTween(target, ms = 800) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const valueRef = useRef(target);
  valueRef.current = value;

  useEffect(() => {
    from.current = valueRef.current;
    const start = performance.now();
    let id;
    const step = (t) => {
      const k = Math.min(1, (t - start) / ms);
      const eased = 1 - (1 - k) ** 3;
      setValue(from.current + (target - from.current) * eased);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, ms]);

  return value;
}
