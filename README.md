# routin.fit

A personal workout companion: a weekly plan shown day by day, with separate
**Morning stretches** and **Today's workout** sessions, set-by-set tracking,
automatic rest timers and progress that survives navigation and reloads.

## Run

```bash
npm install
npm run dev     # local dev server
npm test        # parser + estimate tests
npm run build   # production build in dist/
```

## How plans work

Plans are pasted as plain text and parsed in the browser (`src/lib/parsePlan.js`):

```
Mon: Chest & Biceps
* Morning Routine (5 min): cat-cow stretch, wrist circles, shoulder pass-throughs
* Incline Dumbbell Bench Press: 3x6-8
* Hammer Curls + Kickbacks (Superset): 3x10-12 each
* Dead Hangs: 3x 30-45 sec hold (Gym only)

Wed: Rest Day
REST DAY
* Focus on recovery and hydration.
```

If the text can't be read, the plan editor offers **Structure with AI**, which asks
an OpenRouter model to rewrite it into this format; the result still goes
through the same parser. The key and model id are entered on the Plans screen
and stored in this browser only. Move that call to a server function before
sharing the app with other users.

Session lengths are estimates (about 3 s per rep; rest by rep range: ≤8 reps
120 s, ≤10 reps 90 s, otherwise 60 s; supersets rest 60 s after both moves).
See `src/lib/estimate.js`.

## State

Everything lives in a persisted Zustand store (`src/store.js`, localStorage key
`workout-app`). Sessions are keyed by date and kind (`2026-10-16|workout`) and
snapshot the day's exercises when started, so editing a plan never breaks a
session in progress. Timers store an absolute end time, so they keep counting
while you're on another screen or the tab is in the background.
