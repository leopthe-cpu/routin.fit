# routin.fit

## Keep the progress file current

Oz follows progress on the Popmart projects dashboard, which reads `docs/PROGRESS.md` (format: Creative.can `docs/PROGRESS_FORMAT.md`). At the end of every work session:
1. Update the front matter (`updated`, `summary`).
2. Move items between Doing, To do and Done, and add new items. Product and Marketing items can be `@me` (Oz) or `@claude`.
3. Put anything that needs Oz's accounts, keys, decisions or content under To do with `@me`.
4. Only mark an item Done with evidence (a commit, passing tests, a working page).
