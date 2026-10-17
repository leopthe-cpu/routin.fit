import { useRef, useState } from 'react';

const SWIPE = 60; // px sideways to count as a swipe
const DOWN = 90; // px down to count as a pull-down

/**
 * Sideways swipes (and an optional pull-down) for touch and mouse. Uses touch
 * events rather than pointer events so a gesture is still seen when the
 * browser also scrolls. A gesture that moved swallows the click that follows,
 * so swiping across a button doesn't press it.
 */
export function useSwipe({ onPrev, onNext, onDown }) {
  const start = useRef(null);
  const moved = useRef(false);
  const [dx, setDx] = useState(0);

  const begin = (x, y) => {
    start.current = { x, y };
    moved.current = false;
  };
  const move = (x, y) => {
    if (!start.current) return;
    const ddx = x - start.current.x;
    const ddy = y - start.current.y;
    if (Math.abs(ddx) > 10 || Math.abs(ddy) > 10) moved.current = true;
    if (Math.abs(ddx) > Math.abs(ddy)) setDx(ddx);
  };
  const end = (x, y) => {
    const s = start.current;
    start.current = null;
    setDx(0);
    if (!s) return;
    const ddx = x - s.x;
    const ddy = y - s.y;
    if (Math.abs(ddx) > SWIPE && Math.abs(ddx) > Math.abs(ddy) * 1.3) {
      if (ddx < 0) onNext?.();
      else onPrev?.();
    } else if (onDown && ddy > DOWN && ddy > Math.abs(ddx) * 1.3) {
      onDown();
    }
  };

  const handlers = {
    onTouchStart: (e) => begin(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e) => move(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: (e) => end(e.changedTouches[0].clientX, e.changedTouches[0].clientY),
    onTouchCancel: () => {
      start.current = null;
      setDx(0);
    },
    onMouseDown: (e) => begin(e.clientX, e.clientY),
    onMouseMove: (e) => e.buttons === 1 && move(e.clientX, e.clientY),
    onMouseUp: (e) => end(e.clientX, e.clientY),
    onClickCapture: (e) => {
      if (moved.current) {
        e.stopPropagation();
        e.preventDefault();
        moved.current = false;
      }
    },
  };
  return { handlers, dx };
}
