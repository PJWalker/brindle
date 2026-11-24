# Dad Overboard: round 2 playtests

We ran six simulated sessions of the rulebook-aligned app (Complexity 6, the book's moves and Keeper guidance, house rules optional). Each Keeper was an Opus agent, briefed as an experienced PbtA GM who had read the rulebook. Each player was a separate Sonnet session with no tools, new to the game, so it knew only what its Keeper said. Every die was rolled by a logging script. Each game has the Keeper's notes and final report (`gN/gm-notes.md`) and three player interviews (`gN/player-pN-interview.md`).

All six sessions were cut short at the organiser's request after a usage-limit pause. Every table still reached Theorize, the confrontation, End of Session and interviews. The cut cost investigation depth (fewer locations, little night play in most games), not the arc.

| Game | Keeper style | Players | Outcome |
|---|---|---|---|
| g1 | By the book, full Session One script | PbtA veteran, D&D-only, first-time roleplayer | Allison + David; 14 Clues + 3 Void; +8, rolled 16 (12+) |
| g2 | All Optional House Rules, Complexity 8 | puzzle solver, improv ham, skeptic | Andrew, Etienne took the rug; 14 found, 13 counted; +5, rolled 11 (10+) |
| g3 | Danger-forward | horror fan, cautious player, Blades player | Allison, Andrew and Sara moved the body; 10 + 3 Void; +4, rolled 14 (12+) |
| g4 | Cozy and town life | relationship player, impatient case-solver, quiet player with a backstory | Allison, Andrew covering, Tiago moved the body; 13 + 3 Void; +7, rolled 14 (12+) |
| g5 | Convention one-shot | competitive stranger, rules-minded accountant, chatty interrupter | David, with Allison and Andrew; 12 + 3 Void; +6, rolled 9 (7–9) |
| g6 | Shared authorship | story-game veteran, player who freezes when inventing, Murder, She Wrote fan | David with Andrew, Allison drugged the brandy; 14 counted + 3 Void; +8, rolled 2+8 = 10 |

## What worked
- **The book's procedure carried new players.** g1's first-time roleplayer went from "am I allowed to just say what I do?" to co-narrating the confrontation. "If the roll hits, your theory is the truth" (from `r-pitch`) was the line most players said told them what the game wanted (g5, g6).
- **The Day/Night negotiation** was the best-received mechanic wherever it was used (g3). Saying the fear, hearing how it's worse, then choosing to back down or roll made the stakes legible. Being honest about death before the roll produced the only real Crown use. The cautious player stayed engaged without ever going out at night.
- **Theorize as a table discussion**, run with `mv-theorize.gm` (challenge, draw out quiet players, invite retcons), was a highlight in every game.
- **NPC `life` and `guarded` fields** gave instant entrances, prices and tells (Hollis's pie, Etienne's apron, Finch's sherry). They turned town scenes into Meddling Moves (g4, g6).
- **Fixed Facts and Finch's forensics** let Keepers answer timeline and corpse questions consistently without spending Clues. In g6, players overrode the Facts five times with no harm.
- **The Cozy Move** was the emotional high point wherever it was played, and player-written Clues fitted the list and the theory (g1, g4, g5).
- **Lettered options for a freezing player** (2–3 choices "or your own") got him authoring unprompted by mid-session (g6).
- **The Danger & Harm checklists** were concrete enough to use live (g3).

## Problems found

| Problem (games that raised it) | Suggested change |
|---|---|
| **Theorize can't fail at Complexity 6** (6/6). Modifiers were +4 to +8, and the minimum roll was a hit in four games. Tables could Theorize by exchange 6–8. Causes: book-generous Meddling (g1: 11 hits from 14 rolls), multi-Maven Cozy scenes giving several free Clues, 12+ extras, Maven moves (Columbo, Scarecrow) and retcon-to-fit. Complexity 8 alone still left +5 (g2). Nobody had a Crown-worthy Theorize, and players called the roll anticlimactic (g1, g6) | Players didn't want fewer Clues. They asked for a deadline, the choice to Theorize early on a thinner roll, and the chance to be wrong and recover. Options: restore the book's deadline (next row); add a one-shot/pacing note ("if Theorize is already a near-certain hit by mid-session, offer it and spend the time on a harder confrontation or the Void"); promote **strict counting** (g2's clear winner) with a one-sentence test; consider a modifier cap or a "locked Clue" as optional rules |
| **The hook drops the book's clock** (5/6). The app says "several nights ago" and loses "earlier today", "soon he'll be forced to let the family take Albert back to Boston" and "he doesn't need them to solve the whole mystery". It's still tagged `src: "pdf"` | Restore the book's urgency line and the "doesn't need you to solve it" line; label any change from the book as added. g4's Keeper added "I need ONE thing that says foul play" back, and it gave the evening a midpoint goal |
| **`r-pitch` misleads and leaves gaps** (5/6). "Costs you a scene" read as sitting out. It doesn't say: a Clue is a thing in the world, not a deduction or a free fact (wound, blood type); Clues explained away count; nothing modifies Theorize, so Gold Crown can't; everyone must agree; anyone rolls; you can retry after a miss; Crowns come after narration, with Queen = a scene and Void = toward retirement; Cozy Little Place gives advantage. Every g5 player's "one change" was a one-page cheat sheet | Rewrite `r-pitch` as a player card covering exactly those points, and fix the Crown wording |
| **Crowns not understood** (5/6). Plentiful Clues and soft misses meant nobody needed one (g1, g4, g6). Without box texts, players couldn't see the cost | Above, plus: say Meddling stakes before rolling for new players (g6), and give example Crown box texts |
| **Data errors** (6/6): "Gerald Pratt" in `npc-albert` vs Prentiss; two Inn event managers (`npc-lavoie`, `npc-hale`); Andrew and Allison 20 vs 35 years; Sorensen's times (and "received in the study" during the family dinner); Tiago "skipper" vs "deckhand"; c1 rug location vs `npc-etienne.hides` | Fix them all |
| **Missing book content** (4/6): Captain Curly (a Suspect); the "Back of the fish market" location and its Paint the Scene (g3's best scene); the six Moments (`r-prep` says pick 2–3); the marina Paint question has no location; c18's book example (in his pockets) | Restore them |
| **Animal harm vs a common Line** (3/6 tables set it): c15 (rat in a cod), v1 and v5 (dying fish), t4 step 1, Duchess's blood-soaked fur. A Line strips three of six Void Clues | Tag content on clues and threat steps; add replacement Void Clues and a safe Duchess note |
| **No Layer One threshold or stinger** (5/6). `r-flow` says "Midwives stinger (if Layer One unlocked)", but nothing says when it unlocks | Add the threshold rule (or a Void Clue counter) and a short Dad Overboard stinger |
| **No Maven moves in the app** (2/6). Character creation can't run from the app; no Scarecrow guidance | Add the classic Maven moves as reference entries |
| **Player authorship vs Fixed Facts** (3/6). A Cozy Clue contradicted the 12:15 skiff (g1); nothing says who wins | One line in `r-clues` and the Fixed Facts header: player-authored facts and a successful Theorize override the Facts unless they'd solve it outright |
| **Town life**: Bev and all the suspects lack `life` and `guarded`, though `r-townlife` promises them. Only two happenings carry a crossover lead; the impatient player resented a buried lead (g4) | Add the fields; give every happening a crossover Clue or lead |
| **c16 has two competing meanings** (3/6): safe combination (default) vs the lighthouse bearing the Void thread needs; players classed it as Void | Decide; e.g. the bearing as a 12+ extra |
| **Cozy Move edge cases** (3/6): several Mavens each at her own activity each gets a Clue; a Cozy Clue duplicates one already found; it came late | Rule on both; add a midpoint cue ("by the midpoint, or when two Mavens hold Conditions, offer it") |
| **Threat t4 too fast** (g4); its tick rule isn't in `mv-void` (g3); t5 too slow for a one-shot (g6) | Tick t4 once per scene with a Void Clue; mention it in `mv-void` |
| **End of Session is one shared list** (g5); question 4 is satisfied by the opening vignettes (g1) | Per-Maven questions in the app |
| **One search, one roll** (g1, g5): three Mavens declaring the same search; neither book nor app has a group-action rule | One line in `mv-meddle.gm`: one rolls, the others pick another lead |
| **House rules** (g2): strict counting and NPC deflection worked; "talking is free" cut danger and created unlisted "facts"; the clue budget felt like a consolation prize and doesn't cover Cozy Clues | Keep strict counting (with a test) and deflection; pair "talking is free" with the book's "Are you trying to trigger the Meddling Move?"; drop or rework the budget |

## Caveats
- All six sessions were cut short, so night play, Sorensen, the lighthouse and danger escalation are under-tested in most games.
- Keepers rolled every die via the script, so players "never rolled". That's an artefact of the setup.
- Character sheet details (ability spread, Crown box texts, End of Session questions) aren't in the rulebook text, so Keepers used stand-ins.
- The players were AI models told to act like specific kinds of human players. They converge quickly and accept retcons readily, so treat Clue counts and Theorize ease as an upper bound.

## Changes made after round 2
- **Theorize:** `mv-theorize` now defines "incorporated" (why it exists, who left it, what it shows), with an example and a way to settle splits. It tells Keepers what to do when the roll can't miss, and that players may Theorize early. The Theorize board warns when the lowest roll is already a hit. Optional House Rules now lead with strict counting and NPC deflection, add a modifier cap and a "locked Clue", and drop the clue budget and "spread suspicion".
- **Hook:** restored the book's "earlier today", the deadline ("forced to let the family take Albert back to Boston") and "he does not need them to solve the whole mystery", plus an explicit deadline line. The Fixed Facts now start "last night".
- **Player card:** `r-pitch` rewritten to cover the dice, abilities, what a Clue is versus a free fact, Theorize counting, Conditions, A Cozy Little Place, and the Crowns in the book's terms.
- **Data fixes:** Pratt → Prentiss; Allison's "twenty years" → thirty-five; Sorensen's times aligned to Hollis's log; Sorensen now waits in the study during dinner; Tiago is a deckhand; the rug (c1) is consistent with Etienne's notes; the Inn's two event managers merged into Philippa Hale.
- **Book content restored:** Captain Curly (with Fixed Facts, relationships and a solution, s12), "Back of the Fish Market" and its Paint the Scene question, the marina's location, the six Moments (a new mystery field, shown on the dashboard and overview), and c18's "in his pockets" option.
- **Maven moves:** the 20 classic moves added as reference entries, with Keeper notes for the tricky ones. Scarecrow's default gift is c16.
- **Void and Dark Conspiracy:** Layer One is the Midwives scene at the end of the session in which the first Void Clue is encountered (rulebook p. 69 and the Children of Persephone entries). Dad Overboard now has a Midwives scene, a first-glimpse Void Clue (v7) and three Line-safe Void Clues (v8–v10). The dashboard counts Void Clues for the campaign and reminds you about Layer One. The "Something Beneath the Bay" threat (t4) ticks once per scene with a Void Clue. c16 is settled as the safe combination, with the lighthouse bearing as a second reading.
- **Content flags:** clues and NPCs can carry a ⚠ flag and a Line-safe alternative: c15, c20, v1, v5, Duchess and t4's first step.
- **Town life:** Bev, the Krauses, Andrew, Tiago, Prentiss and Curly now have "life right now" and "if the murder comes up" notes. Every happening carries a crossover lead. NPC notes that assumed facts about the Mavens are now questions for the players. Emily has a way to be found ashore.
- **Guidance:**
  - **Meddling:** free facts vs Clues, one roll per shared search, and saying the stakes before rolling.
  - **Cozy Move:** a midpoint cue, the rule for several Mavens at their own activities, duplicate Clues, and options for a player who freezes.
  - **Gold Crown Mysteries Move:** it can't affect Theorize.
  - **Day/Night Moves:** what a 12+ benefit should be, and that there are no pre-roll trades.
  - **Crowns:** a worked example.
  - **Cautious players:** danger that reaches them at home, and night scenes with a companion and a way out.
  - **Player authorship:** a player's version wins over the Fixed Facts.
  - **One-shots:** what to do when Clues come fast.
  - **Warrior's Ball threat (t5):** ticks at each time jump.
- **End of Session:** each Maven has her own marked questions and extra questions (e.g. Milton Hardcastle), and XP is awarded per Maven. Maven cards also track her Maven move, Cozy Little Place items (✓ = marked) and Crown of the Queen boxes.
