# Tour overview tight pick and mover chips

## Status: stopped on one new test assertion
Production presentation changes are applied. Focused verification: **115 passed,1 failed,116 executed/7 files**. No failing test was repaired, skipped or deleted. Full shards and320px checks were not run after this unexpected failure.

Exact tool output:
```text
FAIL src/test/tourOverviewPicksChipsFullBoard.test.tsx > picks chips (Board B) > uses a 46px border-box chip for a pre-round tee with a 1px gap
AssertionError: expected '1' to be '1 1 0%' // Object.is equality
Expected: "1 1 0%"
Received: "1"
src/test/tourOverviewPicksChipsFullBoard.test.tsx:130:30
expect(text?.style.flex).toBe('1 1 0%');
```
The new assertion expects an expanded flex shorthand; jsdom returns the authored `flex:1` as `"1"`. Production was not altered to satisfy the assertion. The new case mounts upcoming without a tee fixture, so it does not yet verify the tee gap despite its name; do not treat it as tee-gap proof.

## Files changed
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx`: remove chip NEEDS block and its three obsolete props; text flex1/minWidth0/hidden overflow; name1.2 line-height; figure1px/1.2/flex/baseline; tee1px/1.2; explicit46px border-box height to enforce signed-off including-outline size without changing avatar28px/padding7.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`: remove only PicksBlock prop handoff and unused toReachWindow; remove score argument from picksIntro; mover name/figure1.2 line-height and1px gap; remove gross/brackets; bare to-par retains getScoreColor, arrows unchanged. Explicit46px border-box height. PicksSheet still receives neededByPlayer unchanged.
- `public/locales/en/tourhub.json`: all four picksIntro strings lose the explanatory second sentence. Remove unused overview.picksNeeds/picksToReach; no remaining source references.
- `src/test/tourOverviewPicksChipsFullBoard.test.tsx`: authorized obsolete to-reach case rewrite and one new case.
- `src/test/tourOverviewMergedAiry.test.tsx`: authorized mover gap assertion only.
- `src/test/tourOverviewScorecardTap.test.tsx`: authorized gross/bracket assertion only plus one new77/+5 case.
- `src/test/pickSheetV2.test.tsx`, `src/test/tournamentPickInsights.test.tsx`: remove only obsolete neededByPlayer/toReachScore/leaderTotal null props from direct PicksBlock fixtures. Assertions unchanged.
- `src/test/overviewTightIntro.test.ts`: one new real-i18next case asserting exact “James leads for us.”.
- `roadmap.md`, project memory and this report: task/spec/status record.

No SQL/migrations, guest browsing, review wizard, news, round plots, deployed RPC/functions, feed_config, round_pool_cap or native/Median edits.

## Existing assertion ledger
No tests deleted. One case renamed/rewritten:
`tourOverviewPicksChipsFullBoard.test.tsx`: “the to-reach line renders as one line only when its condition holds” → “the to-reach line stays absent even in the required-round window”. The brief removes that line in every chip, including required-round states.
- Old `expect(line).not.toBeNull()` → new `expect(cards[1].querySelector('[data-overview-pick-to-reach]')).toBeNull()`.
- Removed obsolete subtree assertion `expect(line.children).toHaveLength(2)`; replaced with `expect(figure.style.marginTop).toBe('1px')` and `expect(figure.style.lineHeight).toBe('1.2')` on retained figure.
- Old `expect(line.style.whiteSpace).toBe('nowrap')` → `expect(figure.style.whiteSpace).toBe('nowrap')`.
- Removed `expect(line.style.textOverflow).toBe('')` and `expect(line.style.borderTop).toBe('')`: absent NEEDS subtree cannot carry styles; its absence is now asserted. Leader and early-round absence assertions retained.

`tourOverviewMergedAiry.test.tsx`, “tightens movers and their figure gap”: mover inner marginTop **'2px' → '1px'**; every other assertion unchanged.

`tourOverviewScorecardTap.test.tsx`, “drops the brackets when no gross is present”: `expect(scores[1].textContent).toBe('64 (−6)')` → `.toBe('−6')`. Test retained; existing first bare-score assertion retained.

`tourOverviewNotStartedPicks.test.tsx`: unchanged; it asserts translation-key request timing, not the old literal sentence. No old-intro literal assertion found in that file.

## Counts and commands
Previous W1 full-suite baseline: **7607 tests/664 files**.
New cases: **+3** (one each in tourOverviewPicksChipsFullBoard, tourOverviewScorecardTap, overviewTightIntro); new file **+1**. Expected full scope **7610 tests/665 files**, not an executed full-suite result.

Focused command:
```text
bunx vitest run src/test/overviewTightIntro.test.ts src/test/tourOverviewPicksChipsFullBoard.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewScorecardTap.test.tsx src/test/tourOverviewNotStartedPicks.test.tsx src/test/pickSheetV2.test.tsx src/test/tournamentPickInsights.test.tsx --maxWorkers=2
```
Result115passed/1failed; log `/tmp/overview-tight-chips/focused.log`.

Shards1–4: **not run** due to unexpected focused failure. No carried W1 shard counts presented as this build's checks. Permitted FW1 meta-line failure did not occur in focused scope.

## 320px check
**Not run**, stopped at focused test failure. No claim of actual46px measurement, name ellipsis or horizontal-overflow verification. Explicit authored heights are not browser geometry evidence.