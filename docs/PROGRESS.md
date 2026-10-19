---
project: routin.fit
updated: 2026-10-18
summary: A personal workout app built 16–18 Oct. It has a sky-themed Today screen, guided stretch, workout and meditation sessions, weights and progress, a 755-exercise library, and it installs and works offline. It is single-user for now: everything stays on the device, there is no sign-in, and the AI plan import uses a key stored in the browser.
---

## Doing

## To do
- [ ] Move the "Structure with AI" call to a server function @claude #ai #security
  Today the OpenRouter key and model are typed in on the Plans screen and kept in the browser. The README says to move this before sharing the app.
  Source: README.md "How plans work"
- [ ] Review the exercise library's tags @me #library
  The tags come from name-based rules and the report says they need review. Fixes go in overrides.json. Who reviews: status unclear.
  Source: docs/library-report.md; README.md "Exercise library"
- [ ] Give movement patterns to the 5 untagged exercises @claude #library
  Air Bike, Battling Ropes, One-Arm Medicine Ball Slam, Sled Overhead Backward Walk, Wind Sprints. They are never suggested as swaps until then.
  Source: docs/library-report.md "No movement pattern"
- [ ] Alarms tile @claude #app
  Disabled for now (a preview only).
  Source: README.md "Today screen"; commit "Workout flow fixes" (2026-10-17)
- [ ] Sign-in and accounts @claude #app
  Settings shows an account placeholder "until sign-in exists". Status unclear: no plan is documented.
  Source: commit "Add exercise weights, suggestions, Progress and Settings" (2026-10-16)
- [ ] Update the README: Meditate is a working guided session now @claude #docs
  The README still says "Meditate and Alarms are previews".
  Source: README.md "Today screen"; commit "Focus views ... guided meditation" (2026-10-17)

## Waiting
- [ ] Decide whether routin.fit is shared with other users @me #decision
  Sharing needs the AI call on a server, and probably sign-in. Neither is planned in the docs.
  Source: README.md "How plans work"; Settings account placeholder
- [ ] Decide where to host the app @me #infra #decision
  server.mjs and npm start serve the build with security headers. No host is documented.
  Source: README.md "Security"; commit "Make the app installable and offline-ready" (2026-10-16)

## Done
- [x] Weekly plan from pasted text, with morning stretch and workout sessions @claude #app (2026-10-16)
  Source: README.md "How plans work"; first commit
- [x] Set tracking with rest timers that survive reloads @claude #app (2026-10-16)
  Source: README.md "State"
- [x] Exercise library: 755 exercises with swap finder @claude #library (2026-10-16)
  Built from free-exercise-db (public domain).
  Source: README.md "Exercise library"; docs/library-report.md
- [x] Installable, offline-ready, with a small static server @claude #app (2026-10-16)
  Source: commit "Make the app installable and offline-ready"
- [x] Working weights, suggested starting weights, kg/lb @claude #app (2026-10-16)
  Source: commit "Add exercise weights, suggestions, Progress and Settings"
- [x] Progress tab and backup export/import @claude #app (2026-10-16)
  Source: commit "Add exercise weights, suggestions, Progress and Settings"
- [x] Starter plan with a leg day and starting weights @claude #app (2026-10-16)
  Source: commit "Add a leg day, rebalance the week"
- [x] Sunrise Today screen with local weather @claude #ux (2026-10-16)
  Sky follows the clock; Open-Meteo weather is off until tapped.
  Source: README.md "Today screen"; commit "Sunrise Today screen"
- [x] Security headers and self-hosted fonts @claude #security (2026-10-16)
  Source: README.md "Security"
- [x] Focus views: swipe between sets, undo, minimize to an island @claude #ux (2026-10-17)
  Source: commits "Focus views" and "Calmer lists, body map, swipe-only focus"
- [x] Guided meditation with breath cues @claude #app (2026-10-17)
  Source: commits "Focus views" and "Calmer lists" (meditation keeps running in the background)
- [x] Body map on the workout card @claude #ux (2026-10-17)
  Source: commit "Calmer lists, body map, swipe-only focus"
- [x] Smoother app: no global redraws, lighter effects, safe areas @claude #performance (2026-10-18)
  Source: commit "Smoother and better-fitted"

## Marketing
- [ ] Plan marketing (nothing documented yet) @me
