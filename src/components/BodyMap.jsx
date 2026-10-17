// A simple, gender-neutral figure (front and back) with the worked muscle
// groups filled in. Shapes are deliberately plain: rounded blocks rather than
// anatomy, so it reads at a glance and doesn't suggest a body type.

import { regionsFor } from '../lib/bodyRegions';

// Each shape: [regionId | null (outline only), element, props]. Left/right pairs share a region.
const pair = (id, make) => [
  [id, ...make(1)],
  [id, ...make(-1)],
];
const mx = (x, w, s) => (s === 1 ? x : 120 - x - w); // mirror a rect across the centre line

const FRONT = [
  [null, 'ellipse', { cx: 60, cy: 20, rx: 12, ry: 15 }],
  ['f.neck', 'rect', { x: 54, y: 34, width: 12, height: 9, rx: 3 }],
  ...pair('f.traps', (s) => ['path', { d: s === 1 ? 'M44 47 Q52 40 55 43 L55 47 Z' : 'M76 47 Q68 40 65 43 L65 47 Z' }]),
  ...pair('f.delts', (s) => ['ellipse', { cx: s === 1 ? 39 : 81, cy: 54, rx: 9, ry: 9 }]),
  ...pair('f.chest', (s) => ['rect', { x: mx(47, 12, s), y: 48, width: 12, height: 20, rx: 5 }]),
  ...pair('f.biceps', (s) => ['rect', { x: mx(29, 10, s), y: 63, width: 10, height: 22, rx: 5 }]),
  ...pair('f.forearms', (s) => ['rect', { x: mx(25, 10, s), y: 87, width: 10, height: 25, rx: 5 }]),
  ...pair(null, (s) => ['ellipse', { cx: s === 1 ? 29 : 91, cy: 118, rx: 5, ry: 6 }]),
  ['f.abs', 'rect', { x: 49, y: 70, width: 22, height: 34, rx: 7 }],
  [null, 'rect', { x: 46, y: 106, width: 28, height: 14, rx: 6 }],
  ...pair('f.quads', (s) => ['rect', { x: mx(46, 13, s), y: 122, width: 13, height: 46, rx: 6 }]),
  ...pair('f.shins', (s) => ['rect', { x: mx(47, 11, s), y: 172, width: 11, height: 40, rx: 5 }]),
  ...pair(null, (s) => ['ellipse', { cx: s === 1 ? 52 : 68, cy: 218, rx: 6, ry: 4 }]),
];

const BACK = [
  [null, 'ellipse', { cx: 60, cy: 20, rx: 12, ry: 15 }],
  ['b.neck', 'rect', { x: 54, y: 34, width: 12, height: 8, rx: 3 }],
  ['b.traps', 'path', { d: 'M60 41 L77 50 L60 66 L43 50 Z' }],
  ...pair('b.delts', (s) => ['ellipse', { cx: s === 1 ? 39 : 81, cy: 54, rx: 9, ry: 9 }]),
  ...pair('b.lats', (s) => ['path', { d: s === 1 ? 'M45 58 L58 68 L58 95 L49 92 Q42 76 45 58 Z' : 'M75 58 L62 68 L62 95 L71 92 Q78 76 75 58 Z' }]),
  ...pair('b.triceps', (s) => ['rect', { x: mx(29, 10, s), y: 63, width: 10, height: 22, rx: 5 }]),
  ...pair('b.forearms', (s) => ['rect', { x: mx(25, 10, s), y: 87, width: 10, height: 25, rx: 5 }]),
  ...pair(null, (s) => ['ellipse', { cx: s === 1 ? 29 : 91, cy: 118, rx: 5, ry: 6 }]),
  ['b.lowerBack', 'rect', { x: 51, y: 96, width: 18, height: 11, rx: 4 }],
  ...pair('b.glutes', (s) => ['rect', { x: mx(46, 13, s), y: 108, width: 13, height: 17, rx: 6 }]),
  ...pair('b.hamstrings', (s) => ['rect', { x: mx(46, 13, s), y: 127, width: 13, height: 41, rx: 6 }]),
  ...pair('b.calves', (s) => ['rect', { x: mx(46, 12, s), y: 172, width: 12, height: 38, rx: 6 }]),
  ...pair(null, (s) => ['ellipse', { cx: s === 1 ? 52 : 68, cy: 218, rx: 6, ry: 4 }]),
];

function Figure({ shapes, lit, label }) {
  return (
    <figure className="flex flex-1 flex-col items-center gap-1">
      <svg viewBox="0 0 120 226" className="h-auto w-full max-w-[130px]" role="img" aria-label={label}>
        {shapes.map(([id, Tag, props], i) => (
          <Tag
            key={i}
            {...props}
            fill={id && lit.has(id) ? 'currentColor' : 'rgb(var(--ink-rgb) / 0.14)'}
            style={{ transition: 'fill 400ms ease' }}
          />
        ))}
      </svg>
      <figcaption className="label text-[9px] opacity-70">{label}</figcaption>
    </figure>
  );
}

export default function BodyMap({ muscles }) {
  const lit = regionsFor(muscles);
  return (
    <div className="flex items-start justify-center gap-4">
      <Figure shapes={FRONT} lit={lit} label="Front" />
      <Figure shapes={BACK} lit={lit} label="Back" />
    </div>
  );
}
