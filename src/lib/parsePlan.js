// Turns free-text plans (the "Mon: Chest & Biceps / * Exercise: 3x8-10" format)
// into structured days. Deterministic and offline; AI import only normalises
// messy text into this same format before it is parsed here.

export const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_ALIASES = {
  mon: 'Mon', monday: 'Mon',
  tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
  wed: 'Wed', weds: 'Wed', wednesday: 'Wed',
  thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
  fri: 'Fri', friday: 'Fri',
  sat: 'Sat', saturday: 'Sat',
  sun: 'Sun', sunday: 'Sun',
};

const DAY_HEADER = /^([A-Za-z]+)\s*[:\-–—]\s*(.*)$/;
const MORNING = /^morning(?:\s+routine|\s+stretch(?:es)?|\s+mobility)?\s*(?:\((\d+)\s*min[a-z]*\))?\s*:\s*(.+)$/i;
const EXERCISE = /^(.+?)\s*:\s*(\d+)\s*[x×]\s*(.+)$/i;

export function emptyDay(key) {
  return { key, title: '', isRest: false, morning: null, exercises: [], notes: [] };
}

/** Split on commas that are not inside parentheses. */
export function splitTopLevel(text, sep = ',') {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/\.$/, '').trim()).filter(Boolean);
}

/** Pull "(...)" groups out of a string: returns [text without them, [notes]]. */
function extractParens(text) {
  const notes = [];
  const rest = text.replace(/\(([^)]*)\)/g, (_, inner) => {
    notes.push(inner.trim());
    return ' ';
  });
  return [rest.replace(/\s+/g, ' ').trim(), notes];
}

/** "6-8" | "Failure" | "30-45 sec hold" | "10-12 each" → target. */
export function parseTarget(raw) {
  const [label, notes] = extractParens(raw);
  const t = { label, kind: 'reps', min: null, max: null, notes };
  if (/^failure\b/i.test(label) || /^amrap\b/i.test(label)) {
    t.kind = 'failure';
    return t;
  }
  const hold = label.match(/^(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:sec|secs|seconds|s)\b/i);
  if (hold) {
    t.kind = 'hold';
    t.min = Number(hold[1]);
    t.max = Number(hold[2] ?? hold[1]);
    return t;
  }
  const reps = label.match(/^(\d+)(?:\s*[-–]\s*(\d+))?/);
  if (reps) {
    t.min = Number(reps[1]);
    t.max = Number(reps[2] ?? reps[1]);
  }
  return t;
}

/**
 * Starting weights written after "@": "@ 31kg", "@ ~16 kg" (~ = estimate),
 * or "@ 15.5kg / ~4kg" for the two halves of a superset.
 */
export function parseStartWeights(text) {
  return text.split('/').map((part) => {
    const w = part.trim().match(/^(~)?\s*(\d+(?:[.,]\d+)?)\s*(kg|lb|lbs)?$/i);
    if (!w) return null;
    const unit = (w[3] ?? 'kg').toLowerCase().startsWith('lb') ? 'lb' : 'kg';
    return { value: Number(w[2].replace(',', '.')), unit, estimated: !!w[1] };
  });
}

function parseExerciseLine(line, dayKey, index, nextGroup) {
  const m = line.match(EXERCISE);
  if (!m) return null;
  const [, rawName, sets] = m;
  let rawTarget = m[3];
  let weights = [];
  const at = rawTarget.match(/^(.*?)\s*@\s*([^@]+)$/);
  if (at) {
    rawTarget = at[1];
    weights = parseStartWeights(at[2]);
  }
  const [nameNoParens, nameNotes] = extractParens(rawName);
  const target = parseTarget(rawTarget);
  const isSuperset =
    /\bsuperset\b/i.test(rawName) || /\s\+\s/.test(nameNoParens);
  const otherNotes = nameNotes.filter((n) => !/^superset$/i.test(n));
  const names = isSuperset ? nameNoParens.split(/\s+\+\s+/) : [nameNoParens];
  const group = isSuperset && names.length > 1 ? nextGroup() : null;

  return names.map((name, i) => ({
    id: `${dayKey}-${index}${names.length > 1 ? String.fromCharCode(97 + i) : ''}`,
    name: name.trim(),
    startWeight: (weights.length > 1 ? weights[i] : weights[0]) ?? null,
    sets: Number(sets),
    target: { ...target, label: target.label.replace(/\s+each$/i, '') },
    supersetGroup: group,
    note: [...otherNotes, ...target.notes].join(' · ') || '',
  }));
}

/**
 * @returns {{ days: Record<string, object>, warnings: string[], dayCount: number }}
 */
export function parsePlanText(text) {
  const days = Object.fromEntries(DAY_KEYS.map((k) => [k, emptyDay(k)]));
  const warnings = [];
  let current = null;
  let exerciseIndex = 0;
  let groupCode = 65; // 'A'
  const nextGroup = () => String.fromCharCode(groupCode++);
  const seen = new Set();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*(?:[*•\-–]|\d+[.)])\s+/, '').trim();
    if (!line) continue;

    const header = line.match(DAY_HEADER);
    const dayKey = header && DAY_ALIASES[header[1].toLowerCase()];
    if (dayKey) {
      current = days[dayKey];
      seen.add(dayKey);
      current.title = header[2].trim();
      if (/^rest\b/i.test(current.title)) current.isRest = true;
      exerciseIndex = 0;
      groupCode = 65;
      continue;
    }
    if (!current) {
      warnings.push(line);
      continue;
    }
    if (/^rest\s*day$/i.test(line)) {
      current.isRest = true;
      continue;
    }
    const morning = line.match(MORNING);
    if (morning) {
      current.morning = {
        minutes: morning[1] ? Number(morning[1]) : 5,
        items: splitTopLevel(morning[2]),
      };
      continue;
    }
    const exercises = parseExerciseLine(line, current.key, exerciseIndex, nextGroup);
    if (exercises) {
      current.exercises.push(...exercises);
      exerciseIndex++;
      continue;
    }
    current.notes.push(line);
  }

  for (const day of Object.values(days)) {
    if (!day.title) day.title = day.isRest || !seen.has(day.key) ? 'Rest Day' : '';
    if (!seen.has(day.key)) day.isRest = true;
  }

  return { days, warnings, dayCount: seen.size };
}

/** True when the parse looks too weak to trust; the UI then offers AI import. */
export function looksUnparsed(result) {
  const exerciseCount = Object.values(result.days).reduce((n, d) => n + d.exercises.length, 0);
  return result.dayCount === 0 || exerciseCount === 0;
}
