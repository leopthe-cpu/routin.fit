// Tagging rules that turn free-exercise-db entries into routin.fit library
// entries. Every rule is a plain regex over the exercise name so it can be
// read, tested and overridden (see overrides.json) without guesswork.
//
// These tags are heuristics, not expert annotations: the build writes a
// report listing what each rule matched so a person can review them.

/** Movement patterns, first match wins. Order matters: specific before generic. */
export const PATTERN_RULES = [
  ['neck', /(isometric|plate|harness|lying).*neck|neck (bridge|curl|extension|flexion|resistance)/i],
  ['wrist', /wrist|forearm|plate pinch|hand squeeze|gripper|finger curl/i],
  ['rotator_cuff', /internal rotation|external rotation|cuban press/i],
  ['shrug', /shrug/i],
  ['upright_row', /upright row|high pull/i],
  ['power', /clean|snatch|jerk|thruster|push press|jammer/i],
  ['rear_delt', /rear delt|reverse fly|reverse flye|face pull|rear lateral|bent.over.*lateral|side lateral.*bent|pull apart|back flyes/i],
  ['lateral_raise', /lateral raise|side lateral|side laterals|lateral$|deltoid raise|iron cross/i],
  ['front_raise', /front.*raise|raise.*(above|over) head|scaption|shoulder raise|straight raises|^(single )?dumbbell raise$/i],
  ['pullover', /pullover/i],
  ['fly', /\bfly|flye|crossover|cross over|pec deck|butterfly|chest squeeze/i],
  ['elbow_extension', /tricep|skull|(?<!glute )kickback|pushdown|push-down|jm press|tate press|chain handle extension/i],
  ['knee_flexion', /leg curl|hamstring curl|ball leg curl|nordic|glute.ham|hamstring slides|manual hamstring/i],
  ['elbow_flexion', /^(?!.*(leg|hamstring|wrist)).*curl/i],
  ['dip', /\bdips?\b/i],
  ['vertical_pull', /pull[- ]?ups?|chin[- ]?ups?|chins\b|pulldown|pull-down|muscle.?up|dead hang|scapular|rope climb/i],
  ['horizontal_pull', /\brows?\b|rowing|inverted|renegade|bench pull|body-up/i],
  ['vertical_push', /shoulder press|overhead press|military|arnold|handstand|landmine press|seated dumbbell press|standing dumbbell press|kettlebell.*press(?!.*floor)|bradford|see-?saw press|bent press|para press|(dumbbell|barbell|cable).*\bpress\b.*(overhead|shoulder)|^(standing |seated )?(barbell|dumbbell) press$/i],
  ['horizontal_push', /bench press|chest press|floor press|push-?ups?|pushups|squeeze press|incline.*(press|bench)|decline.*press|dumbbell press|svend|close-grip.*press|board press|pin press|chain press|power partials/i],
  ['hip_extension', /hip thrust|glute bridge|(?<!hip )bridge|glute kickback|pull.through|hip extension|reverse hyper|hip lift/i],
  ['hinge', /deadlift|rdl|good morning|stiff.leg|swing|hyperextension|back extension|rack pull|pass between the legs/i],
  ['knee_extension', /leg extension|sissy/i],
  ['lunge', /lunge|split squat|step.?up|bulgarian|pistol/i],
  ['squat', /squat|leg press|hack|wall sit/i],
  ['calf', /calf|calves|heel raise|tibialis|ankle/i],
  ['core_lateral', /side bend/i],
  ['core_rotation', /twist|woodchop|wood chop|rotation|pallof|windmill|russian|landmine 180|wiper|spell caster|figure 8|halo|around the world|pirate|cable lift|judo flip|car driver/i],
  ['core_flexion', /crunch|sit-?up|leg raise|knee raise|knee\/hip raise|toes to bar|v-up|jackknife|ab roller|ab wheel|rollout|fallout|tuck|pull-in|flutter|leg lift|elbow to knee|heel touch|pike|hip raise|butt-up|cocoon|otis/i],
  ['core_stability', /plank|hollow|dead bug|bird dog|l-sit|bear crawl|anti|spider crawl|balance/i],
  ['carry', /carry|farmer|yoke|bottoms up/i],
  ['adduction', /adduct|groin/i],
  ['abduction', /abduct|clam|band walk|lateral walk|monster walk/i],
];

/** Joints each pattern loads. Used to filter exercises for injuries. */
export const PATTERN_JOINTS = {
  neck: ['neck'],
  rotator_cuff: ['shoulder'],
  power: ['lower_back', 'shoulder', 'wrist', 'knee'],
  core_lateral: ['lower_back'],
  wrist: ['wrist'],
  shrug: ['neck'],
  upright_row: ['shoulder', 'wrist'],
  rear_delt: ['shoulder'],
  lateral_raise: ['shoulder'],
  front_raise: ['shoulder'],
  pullover: ['shoulder'],
  fly: ['shoulder'],
  elbow_extension: ['elbow'],
  elbow_flexion: ['elbow'],
  dip: ['shoulder', 'elbow', 'wrist'],
  vertical_pull: ['shoulder', 'elbow'],
  horizontal_pull: ['elbow'],
  vertical_push: ['shoulder', 'elbow', 'wrist'],
  horizontal_push: ['shoulder', 'elbow', 'wrist'],
  hip_extension: ['hip'],
  hinge: ['lower_back', 'hip'],
  knee_flexion: ['knee'],
  knee_extension: ['knee'],
  lunge: ['knee', 'hip', 'ankle'],
  squat: ['knee', 'hip', 'ankle'],
  calf: ['ankle'],
  core_rotation: ['lower_back'],
  core_flexion: [],
  core_stability: [],
  carry: ['wrist'],
  adduction: ['hip'],
  abduction: ['hip'],
};

/** Extra joint stress from the variation, added on top of the pattern's joints. */
export const EXTRA_JOINT_RULES = [
  ['lower_back', /bent.over.*(row|barbell)|barbell row|pendlay|t-bar|good morning|(barbell|back|front).*squat|sit-?up|leg raise|toes to bar|overhead squat|standing.*(barbell|military)/i],
  ['wrist', /straight.?bar|barbell curl|standing barbell curl|front squat|push-?ups?|pushups|plank|handstand/i],
  ['shoulder', /behind the (neck|head)|overhead|upright|dip|handstand|snatch/i],
  ['neck', /behind the neck|neck/i],
  ['knee', /jump|bound|hop|plyo|pistol|sissy|deep/i],
  ['ankle', /jump|bound|hop|skip/i],
];

/**
 * Exercises that train the target muscle at long lengths (deep stretch under load).
 * Lengthened training is an active research area; treat this tag as "stretch emphasis".
 */
export const LENGTHENED_RE =
  /incline.*curl|overhead.*(tricep|extension)|pullover|(dumbbell|cable) fly|flyes|romanian|stiff.leg|deficit|sissy|seated leg curl|split squat|bulgarian|deep|preacher|cable crossover|lunge|good morning|jefferson/i;

/** Equipment needed, derived from the dataset's equipment field plus the name. */
export function equipmentFor(ex) {
  const name = ex.name.toLowerCase();
  const set = new Set();
  const eq = ex.equipment;
  if (eq === 'dumbbell') set.add('dumbbell');
  if (eq === 'barbell') set.add('barbell');
  if (eq === 'e-z curl bar' || /\bez[- ]?bar|ez curl/.test(name)) set.add('ez_bar');
  if (eq === 'kettlebells') set.add('kettlebell');
  if (eq === 'bands' || /\bbands?\b/.test(name)) set.add('band');
  if (eq === 'cable' || /cable|pulley|pulldown|face pull|pushdown/.test(name)) set.add('cable');
  if (eq === 'machine' || /machine|smith|leverage|leg press|hack squat|pec deck|lever/.test(name)) set.add('machine');
  if (eq === 'medicine ball') set.add('medicine_ball');
  if (eq === 'exercise ball') set.add('exercise_ball');
  if (eq === 'foam roll') set.add('foam_roller');
  if (/bench|incline|decline|preacher|lying.*(dumbbell|barbell|tricep|extension|fly)|pullover/.test(name) &&
      !/floor|push-?up|pushups|plank|crunch|leg raise(?!.*bench)/.test(name)) set.add('bench');
  if (set.has('barbell') && /squat|bench press|military|overhead press|shoulder press|rack/.test(name)) set.add('rack');
  if (/pull-?ups?|chin-?ups?|chins\b|hanging|dead hang|scapular pull|muscle.?up|toes to bar|knee raise/.test(name)) set.add('pullup_bar');
  if (/\bdips?\b(?!.*(bench|machine|jerk))|parallel bar|l-sit/.test(name)) set.add('dip_bars');
  if (/\brings?\b|suspend|trx/.test(name)) set.add('rings');
  if (/sled|tire|log|yoke|atlas|keg|chain/.test(name)) set.add('specialty');
  if (eq === 'other' && set.size === 0) set.add('other');
  return [...set].sort();
}

export function kindFor(equipment) {
  if (equipment.some((e) => e === 'machine' || e === 'cable')) return 'machine';
  if (equipment.some((e) => ['dumbbell', 'barbell', 'ez_bar', 'kettlebell', 'medicine_ball'].includes(e))) return 'free_weight';
  if (equipment.includes('band')) return 'band';
  return 'bodyweight';
}

/** free-exercise-db lumps all three deltoid heads into "shoulders"; split them by movement. */
export function deltoidHead(pattern) {
  if (pattern === 'lateral_raise' || pattern === 'upright_row') return 'side_delts';
  if (pattern === 'rear_delt') return 'rear_delts';
  return 'front_delts';
}

export function patternFor(ex) {
  const hit = PATTERN_RULES.find(([, re]) => re.test(ex.name));
  return hit ? hit[0] : null;
}

export function jointsFor(ex, pattern) {
  const joints = new Set(PATTERN_JOINTS[pattern] ?? []);
  for (const [joint, re] of EXTRA_JOINT_RULES) if (re.test(ex.name)) joints.add(joint);
  return [...joints].sort();
}
