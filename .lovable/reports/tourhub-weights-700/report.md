# Canonical heading Brief 2 — Tour hub weights to 700 (STOPPED at shard 2)

Edit: 132 declarations in 33 files under src/features/tourhub, 800/900 -> 700, weight only (`git diff` shows every changed line is a weight). Forms found: fontWeight number/string, CSS font-weight, three `up ? 700 : 800` ternaries in PicksBlock.tsx (now `up ? 700 : 700`), one canvas font string in leaderboard/BoardTable.tsx:382 (`800 9.5px` -> `700 9.5px`). No font-extrabold/font-black/font-[800] in this area.
Remaining above 700 in src/features/tourhub: 0. App-wide remaining (non-test, same five forms): 365 occurrences.
Selected-state weight losses: none. The only toggle, tournament tee-day switch `.tv-switch button` (tournament page, upcoming Tee times), was 800 in BOTH states; selected is still marked by background/colour.
Added src/test/tourhubWeightSweep.test.ts (1 test).

Shards: 1 = 2,447 passed. 2 = 2,460 passed / 1 failed: `src/test/pf3aVideoComposerMounted.test.tsx:52` "switches long-video header and publish button to post mode and restores title and details after photo removal" — `Error: Test timed out in 15000ms.` Untouched file, imports nothing from tourhub. Stopped: shards 3–4, after captures, test-pin updates and figure-width check not done.
Before captures (live data, guest): captures/before/.
