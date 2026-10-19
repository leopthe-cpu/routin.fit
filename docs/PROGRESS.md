---
project: routin.fit
updated: 2026-10-19
summary: goodays (formerly routin.fit), a calm daily-ritual app built 16–19 Oct and live on Railway. An iPhone app (Capacitor, with Live Activity and widgets) is set up in the repo and waits for its first Xcode build. Single-user for now: everything stays on the device, there is no sign-in, and the AI plan import uses a key stored in the browser.
---

## Doing

## To do
- [ ] Move to goodays.world @me #infra
  Railway refused to add www.goodays.world: the plan's custom-domain limit is reached (routin.fit and www.routin.fit are attached). Decide: remove the unused routin.fit entry (GoDaddy forwards it) or upgrade. Then add the DNS records Claude sends, forward goodays.world and gooddays.world to https://www.goodays.world, export/import your data, and only then forward routin.fit.
  Source: Railway generate-domain error (2026-10-19)
- [ ] First iPhone build in Xcode @me #ios
  Follow docs/ios-app.md: signing, capabilities (App Groups, Background Modes), add the GoodaysWidgets extension, run on the phone. Confirm the bundle id world.goodays.app before the first App Store upload.
  Source: docs/ios-app.md
- [ ] Join the Apple Developer Program @me #ios #decision
  Not needed to run the app on your own phone; needed for TestFlight and the App Store.
- [ ] Fix whatever the first Xcode build reports @claude #ios
  The Swift code (plugin, Live Activity, widgets) was written without a compiler.
  Source: commit "Rename to goodays and add the iPhone app"
- [ ] Check the rain sound keeps playing with the phone locked @claude #ios
  Background audio mode and audio session are set; Web Audio inside the app may still pause. If so, play it natively.
- [ ] Interactive widget: tick a goal from the home screen @claude #ios
- [ ] Look into AlarmKit for a real alarm (iOS 26) @claude #ios
  The alarm is a notification for now. AlarmKit availability and rules need checking.
- [ ] Remove routin.fit from Railway once goodays.world is live @claude #infra
- [ ] Update the plan doc for the new name and Strava callback domain @claude #docs
- [ ] Move the "Structure with AI" call to a server function @claude #ai #security
  Today the OpenRouter key and model are typed in on the Plans screen and kept in the browser. The README says to move this before sharing the app.
  Source: README.md "How plans work"
- [ ] Review the exercise library's tags @me #library
  The tags come from name-based rules and the report says they need review. Fixes go in overrides.json. Who reviews: status unclear.
  Source: docs/library-report.md; README.md "Exercise library"
- [ ] Give movement patterns to the 5 untagged exercises @claude #library
  Air Bike, Battling Ropes, One-Arm Medicine Ball Slam, Sled Overhead Backward Walk, Wind Sprints. They are never suggested as swaps until then.
  Source: docs/library-report.md "No movement pattern"
- [ ] Sign-in and accounts @claude #app
  Settings shows an account placeholder "until sign-in exists". Status unclear: no plan is documented.
  Source: commit "Add exercise weights, suggestions, Progress and Settings" (2026-10-16)

## Waiting
- [ ] Decide whether routin.fit is shared with other users @me #decision
  Sharing needs the AI call on a server, and probably sign-in. Neither is planned in the docs.
  Source: README.md "How plans work"; Settings account placeholder

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
- [x] Hosted on Railway at www.routin.fit, deploying from main @claude #infra (2026-10-18)
  Source: Railway service "web"; live site
- [x] Rest days open, Goals tile, daily alarm under the weather @claude #app (2026-10-18)
  Source: commit "Rest days open, a Goals tile, and a daily alarm under the weather"
- [x] Renamed to goodays, sunrise icon; old backups still import @claude #app (2026-10-19)
  Source: commit "Rename to goodays and add the iPhone app"
- [x] iPhone app set up: haptics, timer and alarm notifications, Live Activity, Today widget (not compiled yet) @claude #ios (2026-10-19)
  55 tests pass; web build unchanged in the browser.
  Source: commit "Rename to goodays and add the iPhone app"; docs/ios-app.md

## Marketing
- [ ] Plan marketing (nothing documented yet) @me
