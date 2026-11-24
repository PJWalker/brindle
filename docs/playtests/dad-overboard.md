# Dad Overboard: blind playtests

We ran three simulated sessions. Each had one AI Keeper and three AI players. The Keeper ran the mystery from `js/seed.js`. The players had no tools and no file access, so the only thing they knew was what their Keeper told them. Afterwards each Keeper and each player was interviewed. The Keeper notes and player interviews are in `raw/`.

| Game | Keeper style | Players | Outcome |
|---|---|---|---|
| g1 | As written | methodical auditor, theatre ham, horror fan | Allison + Andrew; 9 clues; rolled 11, "right, with a wrinkle" |
| g2 | Action-forward | cautious boardgamer, impulsive brawler, veteran theorist | Allison + Andrew; 11 clues; rolled 14, clean |
| g3 | Interview-heavy | skeptic, shy newcomer, hunch-driven novelist | Allison + Andrew; 12 clues; rolled 12, clean |

## What worked
- Concrete physical clues: the watch (c4), the rug (c1), the certificates in ice (c7), the rat in the cod (c15) and the earring (c14). Every table built its theory on these.
- NPC quotes and prompts were directly playable. The standouts were Hollis's log in exchange for a pie, Sorensen's line "Death doesn't cancel a debt", Pelletier's "I definitely won't mention the watch" and Andrew's too-precise timeline.
- The fish market and cold store were the best-loved location in all three games.
- The complications list and the deadline threats t1 and t2 created real pressure.

## Problems found, and what changed

| Problem (number of games that raised it) | Change |
|---|---|
| Theorize was a formality. Tables found 17 to 20 clues, so Complexity 6 meant almost any theory succeeded (3/3) | Complexity raised to 8. New clue-counting rule: a clue counts only if the theory explains it, not merely tolerates it. Pacing target of 10–14 clues per session. "Talking is free" guidance on when to call for a roll |
| No real timeline or time of death. Every Keeper invented one, and the three versions contradicted each other (3/3) | A **Fixed Facts** timeline in the Keeper's background. None of it names a culprit. The death window is 11:52pm to 12:35am, pinned by Albert's call to his lawyer. Autopsy facts added to Dr. Finch |
| Hollis's log contradicted itself: rel19 said it showed Sorensen, s6 said Etienne (2/3) | The log shows Sorensen out 9:50pm and back 12:40am. Hollis separately saw an *unlogged* skiff row out at 12:15 |
| The safe and filing cabinet had no contents, so the study was a dead end (3/3) | Contents defined. Other routes added so c17 and c18 can surface without opening the safe |
| "Decide in play" clues (c9, c11, c13, c16, c5) gave the Keeper nothing to choose from (3/3) | Each now has a menu of options, a default, and which theory each option lights up |
| Clues pointed mostly at Allison and Andrew, and every table accused them (3/3) | Points rebalanced. New clues for the under-covered suspects: c22 (Emily/Sorensen), c23 (Etienne/Tommy), c24 (Sorensen), c25 (Sara/suicide), c21 (Andrew) |
| Sorensen and Tommy had secrets and clues but appeared in no solution (2/3) | Both added as suspects, with s10 and s11. Existing solutions updated for the new clues and timeline |
| The Void clues felt like decoration and never connected to anything (3/3, every player) | A **Void Thread** section ties the 1998 bargain, the spiral tattoo, the deckhand Tiago, the prayer group and Sorensen's employers into one thread players can pull. It frames the motive without solving the murder. A "Say This at the Start" rule tells players up front what Void clues are |
| Players only learned what Theorize needed at the end (3/3) | New rule, "Say This at the Start", for the Keeper to tell players at the start |
| Splitting the party made it hard to follow other groups' findings (3/3) | New rule, "When the Mavens Split Up". The flow now includes recapping open leads at each scene change |
| Threats had no triggers; t4 never moved, and t1 effectively began at step 3 (3/3) | Each threat says when it ticks and how to stop it. t4 cut from 6 steps to 4. t1 reordered |
| Missing NPCs: the lawyer, someone at the Inn, the crew (3/3) | Added Gerald Prentiss (lawyer, phone only), Philippa Hale (Inn) and Tiago Mendes (deckhand). Locations now list who is there |
| Ages were missing, and one player made Sara 16. Andrew's "twenty years" couldn't make him David's father (1/3, plus audit) | Ages added. Andrew's service changed to thirty-five years |
| The hook says "several nights" but the background says "three nights" (2/3) | The background now explains the two |

## Not changed
- The published mystery text (`src: "pdf"`): the hook, the establishing question and the clue texts c1–c20.
- The mystery stays open-ended, with no fixed culprit. The fixed facts deliberately fit several solutions.
- The Keepers suggested cutting townsfolk (Margo, Nadine, the chapel). They're kept and marked optional.

## Note on the simulation
The players were AI models told to act like specific kinds of human players, and so were the Keepers. They are fast to agree with each other and generous with clues, so read the clue counts as an upper bound.

## Rulebook alignment (later revision)

The app's rules were later checked against the *Brindlewood Bay* rulebook's Keeper chapters. Where the playtest changes contradicted the book, the book now wins by default:

- Dad Overboard is back to **Complexity 6**.
- Every Meddling hit finds a Clue, and Keepers are told to be generous about triggering it.
- Void Clues don't count at Theorize.
- Theorize opens once the Mavens have found half the Complexity in Clues.

The playtest changes (Complexity 8, a clue budget, "talking is free", strict counting) are now listed under **Optional House Rules** in Moves & Rules.
