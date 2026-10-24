# routin.fit

## Keep the progress file current

Oz follows progress on the Popmart projects dashboard, which reads `docs/PROGRESS.md` (format: Creative.can `docs/PROGRESS_FORMAT.md`). At the end of every work session:
1. Update the front matter (`updated`, `summary`).
2. Move items between Doing, To do and Done, and add new items. Product and Marketing items can be `@me` (Oz) or `@claude`.
3. Put anything that needs Oz's accounts, keys, decisions or content under To do with `@me`.
4. Only mark an item Done with evidence (a commit, passing tests, a working page).

## Library documentation (Context7)

- Before relying on a detail of a library, framework, SDK, CLI or cloud service (API syntax,
  options, configuration, versions, migrations), look it up with the Context7 connector
  (`resolve-library-id`, then `query-docs`) instead of answering from memory. Say which source
  confirmed it.
- If Context7 has nothing, or only part of the answer (for example another SDK's version of the
  method), say so and check the official docs directly. Never fill the gap with a guess.
- Queries go to a third-party service: send library names and the question only, never keys,
  tokens, personal data or this project's code.
- It needs the Context7 connector on for the session and `context7.com` allowed in the cloud
  environment's network settings. If the tools are missing, say so instead of skipping the check.
