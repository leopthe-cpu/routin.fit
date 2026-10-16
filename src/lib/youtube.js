// YouTube searches for an exercise's form. Searches are as specific as we can
// make them: stretches use a hand-written query; exercises use the name as the
// user wrote it (minus notes in brackets) plus "proper form tutorial", so the
// results are about that exact movement. A line naming two moves ("Dead Hangs
// & Scapular Pull-Ups") gets one link per move.

import { findStretch } from '../data/stretches';

const url = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

function clean(name) {
  return name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @returns {{ label: string, url: string }[]} */
export function formLinks(name) {
  const stretch = findStretch(name);
  if (stretch) return [{ label: stretch.name, url: url(stretch.youtube) }];
  const parts = clean(name)
    .split(/\s+(?:&|\+|and)\s+/i)
    .filter(Boolean);
  return parts.map((part) => ({ label: part, url: url(`${part} proper form tutorial`) }));
}
