# Actual strokes, not handicap-capped scores

## Result
Implemented the brief's code changes. **gam-evaluator deployed successfully after all four shards passed.** Submitted source SHA-256: `d4e8e6881c71ce88c5a4931a5aeba06bf7ab3377745e3fcd6f0b187a19dc7b1a`.
Non-mutating live `GET /gam-evaluator` returned HTTP 200 with unchanged version `2026-09-20T00:00:00Z-v10-hole-units-best-or-birdie` at 08:40:45 UTC on 21 November 2026. This verifies deployed function availability, not historical round readback.

No SQL, migrations, feed_config, round_pool_cap changes, backfill, requeue or explicit reevaluation. Ben owns stored-round backfill. EVALUATOR_VERSION, GAM_EVALUATOR_VERSION, FUNCTION_VERSION, grossForPrompt, legends/crown, awards, notifications and rate-course-prompt code unchanged. Genuine handicap figures and calculations untouched.

## Files changed
- `supabase/functions/gam-evaluator/roundGross.ts` — pure typed helper, no Deno/network imports. holeStrokes uses actual first; actualRoundGross sums only a complete declared-length distinct-hole card, every row played and every actual gross present, otherwise score actual then adjusted then null. Local header explains scored/handicap separation.
- `supabase/functions/gam-evaluator/index.ts` — import helpers, grossScore and per-hole hs readers only, with matching gross comment. Existing flags, counts and runs derive from these corrected inputs.
- `src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx` — actual-first strokesOf and §1.3 comments only. Its existing score-level grossVal reader was not listed for change and remains unchanged; stored-round correction remains Ben's task.
- `src/components/explore-tab-new/courseled/hooks/useRoundHoleShapes.ts` — actual-first sheetStrokes and matching §1.3 comments; curve/filter and reads unchanged.
- `src/components/profile/handicap/whs/sections/round-card/RoundCardHoleStrip.tsx` — actual-first nine total, anyPlayed and hole score. Additionally removed FONT_SF constant and its fontFamily application, **expressly authorised by the user's “Inherit app font” answer**; no other style changes.
- `src/test/roundGrossActual.test.ts` — four requested pure-rule cases.
- `src/test/roundCardHoleStripActual.test.tsx` — requested actual-six render case.
- `roadmap.md` and this report folder — accounting/status, focused and full runner output.

Architecture stays local: pure evaluation ownership is documented in roundGross.ts, and sheet/seed ownership remains beside its readers. Root AGENTS.md is at its budget and unchanged.

## Test inventory and assertions
Last verified baseline **9,395 tests / 839 files**. Before this request: 9,395. After: **9,400 / 9,400 passed across 841 files**. Full delta **+5 tests / +2 files**:
1. roundGrossActual `(a) a complete 18-hole actual 66 / adjusted 65 card returns 66` — complete actual sum equals 66, with null score actual and adjusted 65.
2. roundGrossActual `(b) a missing actual hole falls back to score actual, then adjusted` — missing actual hole returns score actual 66; when score actual is null returns adjusted 65.
3. roundGrossActual `(c) actual 6 / adjusted 5 on par 4 is six strokes and a double, not bogey` — holeStrokes equals 6, difference equals 2, canonical holeMarkGrade equals double.
4. roundGrossActual `(d) a hole-in-one stays one actual stroke` — actual 1 / adjusted 3 returns 1.
5. roundCardHoleStripActual `(e) renders six for a hole with actual 6 and adjusted 5` — actual renderer's double mark parent text equals 6.

Existing tests deleted, renamed, rewritten or assertions changed: **none**. No adjusted-first protecting assertion was found in the audited tests; all unchanged tests passed. Vitest imported the new Supabase-directory module successfully without duplicating its logic. The new render test's selector was corrected before its first run after inspecting actual ScoreMark attributes; no failed test was rerun or repaired.

## Commands and full output
| Command | Files passed | Tests passed / executed | Full output |
|---|---:|---:|---|
| `bunx vitest run src/test/roundGrossActual.test.ts src/test/roundCardHoleStripActual.test.tsx src/test/scorecardHeadPar.test.tsx src/test/roundSheetSeed.test.ts src/test/roundDetailNetRead.test.tsx` | 5 | 19 / 19 | focused.log |
| `bunx vitest run --shard=1/4` | 211 | 2,311 / 2,311 | shard-1.log |
| `bunx vitest run --shard=2/4` | 211 | 2,292 / 2,292 | shard-2.log |
| `bunx vitest run --shard=3/4` | 211 | 2,350 / 2,350 | shard-3.log |
| `bunx vitest run --shard=4/4` | 208 | 2,447 / 2,447 | shard-4.log |

Four shards ran **once, sequentially, each as its own command**. Zero failures. 9,400 full-suite executed/passed; focused 19 are duplicate checks and not added to inventory. Existing jsdom container-query parsing diagnostics remain in full output; no runner test failures.
The font answer arrived after shard one finished. Font inheritance was applied before shard two; shard one covers the scoring edit before that font-only addition, shards two–four cover the final files. The affected strip render test and scorecardHeadPar both passed in the remaining shards. No additional full run was started.

## Limits and preview
Latest observed preview harness entry: `=== build 2026-11-21T08:31:45Z ===` / `build OK`.
Authenticated actual-round evaluation/readback is unverified (`external_unmanaged`); no round was invoked for testing because this brief expressly forbids reevaluation and delegates backfill to Ben. The actual 66 vs adjusted 65 and six-vs-five rules are verified with concrete tests, and deployment/availability is verified separately.
