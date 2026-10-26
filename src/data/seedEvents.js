// The owner's league games (Olympique DG, Wednesday nights at Central Tech),
// added on request so they show in the calendar from the start.
const game = (date, time, field, opponent) => ({
  id: `ev_odg_${date}`,
  kind: 'soccer',
  title: `Olympique DG vs ${opponent}`,
  date,
  time,
  place: `Central Tech (${field})`,
  note: 'League game',
});

export const SEED_EVENTS = [
  game('2026-10-28', '20:00', 4, 'Charlie Wonderland'),
  game('2026-11-11', '23:00', 2, 'GFC'),
  game('2026-11-25', '22:00', 2, 'Fireball FC'),
  game('2026-12-02', '22:00', 2, 'Rice Rice Baby'),
  game('2026-12-09', '21:00', 1, 'Courage Cookies FC (11C)'),
  game('2027-01-06', '21:00', 3, 'exacare fc'),
];
