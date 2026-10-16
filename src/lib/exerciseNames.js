// Name normalisation shared by the library build script and the in-app matcher.

const PHRASES = [
  [/&/g, ' and '],
  [/\([^)]*\)/g, ' '],
  [/\bdb\b/g, 'dumbbell'],
  [/\bbb\b/g, 'barbell'],
  [/\bkb\b/g, 'kettlebell'],
  [/\b(single|one)[- ]arm(ed)?\b/g, 'one-arm'],
  [/\b(single|one)[- ]leg(ged)?\b/g, 'one-leg'],
  [/\be-?z[- ]?(curl )?bar\b|\bez\b/g, 'ez-bar'],
  [/\bpull[- ]?ups?\b/g, 'pull-up'],
  [/\bchin[- ]?ups?\b/g, 'chin-up'],
  [/\bpush[- ]?ups?\b/g, 'push-up'],
  [/\bsit[- ]?ups?\b/g, 'sit-up'],
  [/\bflye?s?\b|\bflies\b/g, 'fly'],
  [/\bskull ?crushers?\b/g, 'skull-crusher'],
  [/\btriceps\b/g, 'tricep'],
  [/\bbiceps\b/g, 'bicep'],
];

function singular(word) {
  if (word.length <= 3 || word.endsWith('ss')) return word;
  if (word.endsWith('ches') || word.endsWith('shes')) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

export function normalizeName(name) {
  let s = ` ${name.toLowerCase()} `;
  for (const [re, rep] of PHRASES) s = s.replace(re, rep);
  return s
    .replace(/[^a-z0-9/\- ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singular)
    .join(' ');
}

const STOPWORDS = new Set(['the', 'a', 'an', 'with', 'on', 'of', 'and', 'to', 'for', 'in', 'over', 'heavy', 'weighted', 'standing']);

export function nameTokens(name) {
  return normalizeName(name)
    .split(/[\s/]+/)
    .filter((t) => t && !STOPWORDS.has(t));
}
