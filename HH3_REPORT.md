# HH3 Head to head - build report (STOPPED at shard 3)

## Status
Built. Full suite: shard 3 had one failure, so per the stop rule HH3 is not signed off. The full output is kept.

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
