// Rough session-length and copy generation. The numbers are assumptions
// (about 3 s per rep, rest by rep range), so the UI always shows "≈".

const SEC_PER_REP = 3;
const SETUP_SEC = 45; // moving between exercises, loading dumbbells
const SUPERSET_REST = 60;
const FAILURE_REPS = 12;

/** Rest after a set, chosen from the target: heavier (low-rep) work rests longer. */
export function restSecondsFor(exercise) {
  if (exercise.supersetGroup) return SUPERSET_REST;
  const t = exercise.target;
  if (t.kind === 'hold') return 60;
  if (t.kind === 'failure') return 75;
  const low = t.min ?? 10;
  if (low <= 8) return 120;
  if (low <= 10) return 90;
  return 60;
}

function workSeconds(exercise) {
  const t = exercise.target;
  if (t.kind === 'hold') return ((t.min ?? 30) + (t.max ?? t.min ?? 30)) / 2;
  if (t.kind === 'failure') return FAILURE_REPS * SEC_PER_REP;
  const avg = ((t.min ?? 10) + (t.max ?? t.min ?? 10)) / 2;
  return avg * SEC_PER_REP;
}

/** Group a day's exercises into blocks: a single exercise, or a superset pair. */
export function toBlocks(exercises) {
  const blocks = [];
  for (const ex of exercises) {
    const last = blocks[blocks.length - 1];
    if (ex.supersetGroup && last && last.group === ex.supersetGroup) last.exercises.push(ex);
    else blocks.push({ group: ex.supersetGroup, exercises: [ex] });
  }
  return blocks;
}

export function estimateWorkoutMinutes(exercises) {
  let total = 0;
  for (const block of toBlocks(exercises)) {
    const sets = Math.max(...block.exercises.map((e) => e.sets));
    const work = block.exercises.reduce((s, e) => s + workSeconds(e), 0);
    const transitions = (block.exercises.length - 1) * 15;
    const rest = restSecondsFor(block.exercises[0]);
    total += SETUP_SEC + sets * (work + transitions) + (sets - 1) * rest;
  }
  return Math.max(5, Math.round(total / 60 / 5) * 5);
}

export function totalSets(exercises) {
  return exercises.reduce((n, e) => n + e.sets, 0);
}

const MUSCLE_RULES = [
  ['forearms', /wrist curl|forearm|farmer/i],
  ['rear delts', /reverse fl|face pull|rear delt/i],
  ['traps', /shrug/i],
  ['neck', /neck/i],
  ['core', /leg raise|sit-?up|twist|crunch|plank|ab wheel|hollow/i],
  ['chest', /bench press|squeeze press|floor press|chest fly|pec|push-?up|dip/i],
  ['back', /row|pullover|pull-?up|pulldown|lat |dead hang|chin-?up/i],
  ['shoulders', /shoulder press|overhead press|lateral raise|arnold|front raise/i],
  ['triceps', /skull|tricep|kickback|pushdown|overhead .*extension|close-grip/i],
  ['biceps', /curl|hammer/i],
  ['legs', /squat|lunge|deadlift|rdl|calf|leg press|leg curl|leg extension|hip thrust|glute/i],
];

export function musclesFor(exercises) {
  const found = [];
  for (const ex of exercises) {
    const hit = MUSCLE_RULES.find(([, re]) => re.test(ex.name));
    if (hit && !found.includes(hit[0])) found.push(hit[0]);
  }
  return found;
}

function joinWords(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} & ${words[words.length - 1]}`;
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function workoutCopy(day) {
  const muscles = musclesFor(day.exercises);
  const supersets = new Set(day.exercises.map((e) => e.supersetGroup).filter(Boolean)).size;
  const parts = [`${day.exercises.length} exercises`, `${totalSets(day.exercises)} sets`];
  if (supersets) parts.push(`${supersets} superset${supersets > 1 ? 's' : ''}`);
  return {
    title: "Today's workout",
    subtitle: muscles.length
      ? capitalise(muscles.length > 4 ? `${muscles.slice(0, 3).join(', ')} + ${muscles.length - 3} more` : joinWords(muscles))
      : day.title,
    detail: parts.join(' · '),
    minutes: estimateWorkoutMinutes(day.exercises),
  };
}

const STRETCH_RULES = [
  ['mobility', /mobility|posture|flow/i],
  ['hips', /hip|groin|90\/90|pigeon/i],
  ['wrists & ankles', /wrist|ankle/i],
  ['spine', /cat-?cow|spine|thoracic/i],
  ['shoulders', /shoulder|pass-?through/i],
  ['hamstrings', /hamstring|toe touch/i],
];

function stretchAreas(items) {
  const found = [];
  for (const item of items) {
    for (const [area, re] of STRETCH_RULES) if (re.test(item) && !found.includes(area)) found.push(area);
  }
  return found;
}

export function morningCopy(morning) {
  const n = morning.items.length;
  return {
    title: 'Morning stretches',
    subtitle: `Start your day loose: ${joinWords(stretchAreas(morning.items)) || 'full-body mobility'}`,
    detail: `${n} move${n === 1 ? '' : 's'} · about ${Math.max(1, Math.round((morning.minutes * 60) / n / 10) * 10)} s each`,
    minutes: morning.minutes,
  };
}
