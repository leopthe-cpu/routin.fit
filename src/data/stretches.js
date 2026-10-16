// Details for morning-routine moves: what the move is, what it does, how much
// of it to do, and a precise YouTube search. Matched by name or alias.
//
// `dose` drives the timer: `seconds` is the whole move; when `perSide` is set
// the timer cues a switch halfway. Descriptions stick to what the move
// mechanically does (which joints move, through which range); they avoid
// claims about outcomes that depend on the person.

import { normalizeName } from '../lib/exerciseNames';

export const STRETCHES = [
  {
    id: '90_90_hip_switch',
    name: '90/90 Hip Switch',
    aliases: ['90/90 hip/groin opener', '90/90 hip opener', '90 90 hip stretch', '90/90 hip switch'],
    what: 'Seated hip rotation drill: both knees bent at 90°, rotating them from one side to the other.',
    benefit:
      'Moves each hip through internal and external rotation, the range used when squatting, lunging and sitting cross-legged.',
    dose: { label: '8 switches, 4 each side · slow', seconds: 75, perSide: false },
    youtube: '90 90 hip switch mobility drill how to',
  },
  {
    id: 'wrist_ankle_circles',
    name: 'Wrist & Ankle Circles',
    aliases: ['wrist/ankle circles', 'wrist and ankle circles', 'wrist circles', 'ankle circles'],
    what: 'Slow, full circles of each wrist, then each ankle, in both directions.',
    benefit:
      'Takes the wrists and ankles through their full circle of motion. Moving a joint spreads synovial fluid, its natural lubricant, across the cartilage, a gentle warm-up for pressing and squatting.',
    dose: { label: '10 circles each way · wrists, then ankles', seconds: 60, perSide: true, sideLabels: ['Wrists', 'Ankles'] },
    youtube: 'wrist circles and ankle circles joint warm up',
  },
  {
    id: 'cat_cow',
    name: 'Cat-Cow',
    aliases: ['cat-cow stretch', 'cat cow', 'cat stretch', 'cat camel'],
    what: 'On hands and knees, alternate rounding the back (cat) and arching it (cow).',
    benefit:
      'Moves the spine through flexion and extension one segment at a time; useful for easing the stiffness of a night lying still.',
    dose: { label: '10 slow reps · breathe in on cow, out on cat', seconds: 60, perSide: false },
    youtube: 'cat cow stretch proper form tutorial',
  },
  {
    id: 'shoulder_pass_through',
    name: 'Shoulder Pass-Through',
    aliases: ['shoulder pass-throughs', 'shoulder pass-through', 'shoulder dislocates', 'band pass-through', 'stick pass-through'],
    what: 'With straight arms and a wide grip on a band or stick, lift it over your head and down behind your back, then return.',
    benefit:
      'Takes the shoulders through flexion and extension overhead and opens the chest; the grip width sets the difficulty.',
    dose: { label: '10 reps · narrow the grip only if pain-free', seconds: 60, perSide: false },
    youtube: 'shoulder pass through with band or dowel tutorial',
  },
];

const BY_KEY = new Map();
for (const s of STRETCHES) {
  BY_KEY.set(normalizeName(s.name), s);
  for (const a of s.aliases) BY_KEY.set(normalizeName(a), s);
}

/** Stretch details for a move as written in a plan, or null if unknown. */
export function findStretch(name) {
  return BY_KEY.get(normalizeName(name)) ?? null;
}
