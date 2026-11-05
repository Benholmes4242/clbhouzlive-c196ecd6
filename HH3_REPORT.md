# HH3 Head to head - build report (SIGNED OFF)

## Status
Signed off under Ben's 2026-11-05 ruling after the requested clean shard-3 rerun. Historical failing output remains kept below; neither flaky test was edited. Member browser verification remains unavailable as documented below.

## Failure (shard 3) - unrelated to HH3, not fixed
`src/test/guestStage24.test.tsx:85` "Stage 2.4 — guests on /auth > after a guest signs in as a member, Auth redirects once"
`AssertionError: expected [ '/auth' ] to deeply equal [ '/auth', '/' ]`
Not touched by HH3 (guest auth redirect; guest browsing is out of scope). Run alone three times it passed 5/5 each time, so it looks timing-sensitive under shard load. Full log: docs/verification/hh3/shard3.log. Not edited.

## Shards (--maxWorkers=2)
1: 1,753 passed (151 files) | 2: 1,655 passed (151) | 3: 1,735 passed, 1 failed (151) | 4: 1,683 passed (148)
Total 6,827 tests across 601 files (6,826 passed, 1 failed). Baseline 6,806 / 599 + 21 new HH3 tests in 2 new files = 6,827 / 601. No unhandled errors reported.
Build: OK at 2026-11-05T09:09:15Z.

## Tests
New: src/test/hh3HeadToHead.test.tsx (18), src/test/hh3EntryGate.test.tsx (3; fixture copied whole from fixProfileCompare1, session reads h.anon).
No existing test was rewritten, renamed or deleted.

## Files touched
- compare/headToHeadRules.ts (new): leader/dim, bar share, entry line, course grouping, 18-hole averages, per-course bests
- compare/HeadToHeadDetail.tsx (new): DETAIL view
- compare/HeadToHeadEntryRow.tsx (new): profile entry row
- compare/CompareSheet.tsx: DETAIL replaced; HEAD TO HEAD header in DETAIL only; LIST unchanged
- compare/useCompareStats.ts: course_id added to gam_round_stats select; averages and course bests (client only)
- compare/h2hStats.ts: optional avg_gross, avg_points, course_bests on PlayerStats
- hero/HeroHandicapDisplay.tsx: optional afterChart slot between chart and Form
- hero/ProfileHero.tsx: optional showCompareEntry renders the row
- pages/ProfilePageV2.tsx: passes showCompareEntry={canCompareInPlace}
- Deleted (only CompareSheet imported them): CompareStatRow.tsx, CompareScoreboard.tsx, CompareFormStrip.tsx, compareRanges.ts

## Notes for ruling
- The back arrow stays in the DETAIL header only when the sheet was opened from the list (it's not in the mock). From the profile row there's no back arrow.
- Per-course bests use that player's 18-hole rounds there, so a nine-hole gross can't count as a best.
- If the viewer's index is unknown, the entry line leaves out the gap clause.
- Strings are English literals, not i18n keys (English-only cutover).
- Not checked in the browser (member auth is external_unmanaged).

## Rulings applied (2026-11-05)
- guestStage24: the failing run's log is kept as docs/verification/hh3/shard3-failing-run1.log. On the re-run, guestStage24 passed (5/5, docs/verification/hh3-final/shard3.log:3912). It is recorded as a flaky pre-existing failure.
- FIX_PROFILE_COMPARE_1 round card close: ProfilePageV2 keeps RoundDetailSheet mounted with open=false and the last score id for ROUND_SHEET_CLOSE_MS (300ms, the BottomSheet close), then clears it. New test file: src/test/fixProfileCompare1Close.test.tsx (1 test). No other change.

## Re-run - STOPPED on a new failure
`src/test/ob1Welcome.test.tsx:113` "OB1.2 first sign-in fixes > cropper has no slider, grid or reset and Use photo hands the file to the existing upload"
`AssertionError: expected "spy" to be called with arguments: [ 'profilePhotoBlob', Any<File> ]  Number of calls: 0`
This is the first sign-in welcome flow; HH3 and the close change don't touch it. Run alone three times, it passed 81/81 each time. Not edited. Log: docs/verification/hh3-final/shard3.log.

Shards: 1: 1,753 | 2: 1,648 | 3: 1,733 passed, 1 failed | 4: 1,693. Total 6,828 / 602 files (6,827 passed). Baseline 6,827 / 601 + 1 new test in 1 new file = 6,828 / 602. Build OK at 09:33:41Z.

## Final sign-off (2026-11-05)
- Ben ruled both failures flaky and pre-existing, not caused by HH3 or FIX_PROFILE_COMPARE_1:
  - `guestStage24.test.tsx:85`, "after a guest signs in as a member, Auth redirects once": failing log retained at `docs/verification/hh3/shard3-failing-run1.log`; previously passed 3/3 standalone runs (5 tests each).
  - `ob1Welcome.test.tsx:113`, "cropper has no slider, grid or reset and Use photo hands the file to the existing upload": failing log retained at `docs/verification/hh3-final/shard3.log`; previously passed 3/3 standalone runs (81 tests each).
- For these two briefs only: failures in untouched files passing 3/3 standalone runs are recorded with their failing logs and do not stop work. A touched-file failure or a standalone failure remains STOP AND REPORT.
- Requested rerun command: `bunx vitest run --maxWorkers=2 --shard=3/4`. **1,734 passed / 151 files**, zero failures and no unhandled errors reported; start 10:30:05 UTC, duration 245.13s. Both named files passed (guestStage24 5/5, ob1Welcome 81/81). Full output: `docs/verification/hh3-signoff/shard3.log`.
- Final per-shard totals: **1,754 / 1,649 / 1,734 / 1,696 = 6,833 tests across 602 files**, all passed. Shards 1, 2 and 4 are carried forward from the latest full run (Also this week squircle fix), not rerun in this close-out; shard 3 is the fresh run above.
- Reconciliation: HH3 close-animation inventory 6,828 / 602 + one Featured no-hint test (`fw1FeaturedDeck.test.tsx`) = 6,829 / 602 + four Also this week squircle tests (`alsoWeekSpacing.test.ts`, `alsoWeekRebuild.test.tsx`) = 6,833 / 602. This close-out adds/removes zero tests: before and after **6,833 / 602**.
- No product or test code changed; no test rewritten, renamed or deleted. Existing build result remains as recorded; no new build was run and no current build log was available to quote.
- Follow-up recorded in `roadmap.md`: Investigate shard-3 flakes under --maxWorkers=2 (guestStage24, ob1Welcome).
