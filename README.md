# Keeper's Desk

Offline GM prep & session tool for *Brindlewood Bay* and other Carved-in-Brindlewood games. Optimised for iPad, usable on iPhone. Ships with **Dad Overboard** preloaded and fleshed out.

## Features
- **Session dashboard** — current scene + on-stage NPC cue cards, clue tracker (who/where found), threat clocks, session log, paint-the-scene prompts, end-of-session XP.
- **Theorize board** — tick the clues the players' theory explains; shows modifier (clues − complexity), odds for each result band, and closest prepared theories.
- **Mystery** — hook, establishing question, cast & suspects, clues (suggested locations / who they might point to), threats, possible solutions, relationship web.
- **Setting** — town map with pins, locations (yacht deck plan for The Regal Lady), recurring townsfolk.
- **Mavens** — abilities, XP, Conditions, Crowns of the Void.
- **Moves & rules** — paraphrased quick reference (editable), Keeper moves, safety tools, theorize odds table. Quick "Moves" sheet from any screen.
- **Full editor** for everything; new mysteries, settings and game systems (for The Between, Public Access, hacks).
- Search (⌘K), JSON export/import, works offline once loaded.
- Minimal pure black & white UI for eInk tablets: no colour, greys, shadows or animation; state shown by fill, weight and line style. The contrast button inverts to white-on-black.

Content tagged **added** was written for this app (Dad Overboard was revised after blind playtests — see `docs/playtests/dad-overboard.md`); untagged content comes from the published mystery. Rules text is paraphrased — check your rulebook.

## Run
Static site, no build. Serve the folder (`python3 -m http.server`) or deploy with GitHub Pages
(Settings → Pages → Source: **GitHub Actions**; the included workflow deploys `main`).
On iPad: open in Safari → Share → **Add to Home Screen**.

Data lives in the browser's local storage on each device — use **Library → Export** for backups and to move data between devices.
