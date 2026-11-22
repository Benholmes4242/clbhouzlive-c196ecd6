# Canonical heading Brief 2 — Tour hub weights to 700 (verification resumed under the rulings)

Edit: 132 declarations in 33 files under src/features/tourhub, 800/900 -> 700, weight only (`git diff` shows every changed line is a weight). Forms found: fontWeight number/string, CSS font-weight, three `up ? 700 : 800` ternaries in PicksBlock.tsx (now `up ? 700 : 700`), one canvas font string in leaderboard/BoardTable.tsx:382 (`800 9.5px` -> `700 9.5px`). No font-extrabold/font-black/font-[800] in this area.
Remaining above 700 in src/features/tourhub: 0. App-wide remaining (non-test, same five forms): 365 occurrences.
Selected-state weight losses: none. The only toggle, tournament tee-day switch `.tv-switch button` (tournament page, upcoming Tee times), was 800 in BOTH states; selected is still marked by background/colour.
Added src/test/tourhubWeightSweep.test.ts (1 test).

Shards: 1 = 2,447 passed. 2 = 2,460 passed / 1 failed: `src/test/pf3aVideoComposerMounted.test.tsx:52` "switches long-video header and publish button to post mode and restores title and details after photo removal" — `Error: Test timed out in 15000ms.` Untouched file, imports nothing from tourhub. Stopped: shards 3–4, after captures, test-pin updates and figure-width check not done.
Before captures (live data, guest): captures/before/.


## Rulings closeout — 22 November 2026
- Discover EyebrowBar subline reservation: 19 → 19.8px. Both actual shell and loaded heading measure 39.796875px (CSS rounding) at 390/320. Loading-over-loaded captures: canonical-heading-followups/captures/discover-overlay-ruling-390.png and -320.png.
- Deleted unused SectionHeaderSkeleton export (no consumers); simplified exactly three PicksBlock `up ? 700 : 700` expressions to `700`. No other app edits in this follow-up.

### Tests and reconciliation
Last completed baseline: 9,929 tests / 877 files (c4c6dfe). Brief 2 added only `tourhubWeightSweep.test.ts`, “every file is clear of all five forms”: +1 test / +1 file. Current before/after inventory for these rulings: 9,930 / 878 → 9,930 / 878. No cases deleted, renamed or rewritten; only these two expressly authorised assertions changed:

1. `tourSheetsAndTeeTimes.test.ts:27`, “the LEADERBOARD kicker is white (board ink) in this sheet only”.
   Old: `expect(css).toContain('.tour-board-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:20px 18px 6px; font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tour-board-amber); }');`
   New: `expect(css).toContain('.tour-board-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:20px 18px 6px; font-size:10.5px; font-weight:700; letter-spacing:.16em; color:var(--tour-board-amber); }');`
   Why: explicitly authorised obsolete Tour weight pin, preserving all other CSS checks.
2. `leaderboardsPage.test.tsx:117`, “LEADERBOARD is ink, not amber”.
   Old: `expect(css).toContain('.tour-board-section-title { margin:0; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--tour-board-ink); white-space:nowrap; }');`
   New: `expect(css).toContain('.tour-board-section-title { margin:0; font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--tour-board-ink); white-space:nowrap; }');`
   Why: same express authorisation; no other assertion or test name changed.

Commands run separately and sequentially: `./node_modules/.bin/vitest run --shard=2/4` (2,461 passed / 220 files); `--shard=3/4` (obsolete authorised pin failed, updated then rerun: 2,460 passed / 220 files); `--shard=4/4` (second obsolete authorised pin failed, updated then rerun: 2,562 passed / 218 files). Retained shard 1: 2,447 passed / 220 files. Total 9,930 passed / 878 files. The ruled pf3aVideoComposerMounted timeout did not recur; that test was untouched, so no isolated rerun was necessary. Full available resumed logs, including pre-pin-update failures, are in logs/rulings. Shard 1 was not rerun; its original full log is not retained here. Preview diagnostic: build OK.

### Captures and figures
- Live guest app after-captures at 390/320: overview, schedule, players, news, RSM tournament and live board. Side-by-side images use the retained before screenshots; live data advanced, so these are not identical-data pixel comparisons. Player after-capture is included only if available in captures/after; see finish_measure.log for its actual navigation result.
- Real-component test-data captures at both widths: between-rounds hero/board/live picks, upcoming hero/PicksBlock, Champions recap/Our picks. No root horizontal overflow in any checked live or fixture state; fixture page error lists are empty. Temporary capture page removed.
- Same-data browser 700/800 comparison of numeric boxes and parent columns across those fixtures: no measured column width or left-coordinate shifts (tolerance 0.01px); raw values in captures/figure-width-ruling.json. This is a controlled browser weight comparison, not recovered pre-sweep DOM metrics; before screenshots contain no numeric measurements. Font ink/physical-phone differences remain unverified.
- Upcoming fixture gives explicit independent hero and pick tee inputs; it is a presentation fixture, not evidence of live schedule/tee parity.

### Final audit
0 remaining above-700 declarations in src/features/tourhub. Current app-wide census: **364** pattern hits in non-test TS/TSX/CSS using the sweep test's forms and comment exclusions; exact locations retained in remaining-weight-ruling.json. The prior report said 365 without retaining its census; this corrected, reproducible count is not a claim that this narrow follow-up removed another app-wide weight declaration. No SQL, migrations, edge changes, feed_config or round_pool_cap edits.
