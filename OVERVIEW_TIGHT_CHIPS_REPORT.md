# Tour overview tight pick and mover chips

## NEEDS assertion repair and completed verification — 7 November 2026

Production unchanged. Only `src/test/tourHeroRefinements.test.tsx` was edited: **“renders the Needs gross as a separate untruncated white figure and omits leading/level picks”** was renamed **“pick chips carry no Needs line”**. Entries, `f.picks` and mount are unchanged.

Old assertions after the mount:
```tsx
const lines = v.container.querySelectorAll<HTMLElement>('[data-overview-pick-to-reach]');
expect(lines).toHaveLength(1);
expect(lines[0].children[1].textContent).toBe('66');
expect(lines[0].style.textOverflow).toBe('');
expect(lines[0].style.overflow).toBe('');
expect(lines[0].style.gap).toBe('4px');
expect(lines[0].style.textTransform).toBe('uppercase');
```
New assertions:
```tsx
expect(v.container.querySelectorAll('[data-overview-pick-to-reach]')).toHaveLength(0);
expect(v.container.textContent).not.toMatch(/needs/i);
```
Reason: the signed-off tight chips intentionally removed the NEEDS line; its former value/style assertions are obsolete. This is the sole renamed/rewritten case. No cases added, deleted or skipped, no other tests changed; the file remains **12 cases**.

### Completed shared suite
Commands, each run once in this repair:
```text
bunx vitest run --maxWorkers=2 --shard=2/4
bunx vitest run --maxWorkers=2 --shard=3/4
bunx vitest run --maxWorkers=2 --shard=4/4
```
| Shard | Passed | Failed | Files | Provenance |
|---|---:|---:|---:|---|
| 1/4 | 2,000 | 0 | 168 | Previously passed; not rerun, as requested |
| 2/4 | 1,828 | 0 | 168 | Fresh rerun |
| 3/4 | 1,954 | 0 | 168 | Fresh run |
| 4/4 | 1,875 | 0 | 165 | Fresh run |

Fresh shards 2–4: **5,657 passed / 501 files**, zero failures. Combined with the previously reported shard 1: **7,657 passed / 669 files**, zero failures. This is completed shared verification, not four fresh shards in this turn. FW1's allowed-known meta-line failure did not occur; its 34 cases passed in shard 2. The repaired Tour hero refinements file passed all 12 cases.

Counts before/after: **7,657 tests / 669 files → 7,657 tests / 669 files**, delta **0 tests / 0 files**. The previously expected inventory is now verified by combined shard totals. Reconciliation from the last full green **7,607/664**: tight chips **+3/+1**, photo grid **+22/+2**, Tour B **+16/+1**, course heroes **+9/+1** = **7,657/669**. No repeated focused runs are added to these totals.

Logs: `/tmp/needs-closeout/shard2.log`, `shard3.log`, `shard4.log`. Preview build log: `2026-11-07T20:47:02Z build OK`. No browser reruns requested; existing 320px results and live-device limitations remain unchanged. No production, SQL, migration, RPC/edge, guest, review wizard, news, round plot, feed_config, cap or native/Median changes.

**This section supersedes all historical suite stops below; those entries remain as audit history.**

## Authorised test-only close-out — 7 November 2026
Changed **only** `src/test/tourOverviewPicksChipsFullBoard.test.tsx:130`, in “uses a 46px border-box chip for a pre-round tee with a 1px gap”:
- Old: `expect(text?.style.flex).toBe('1 1 0%');`
- New: `expect(['1', '1 1 0%']).toContain(text?.style.flex);`
Reason: accepts jsdom's authored shorthand and the equivalent expanded form. Production unchanged. No tests added, removed, renamed or otherwise rewritten in this close-out; count delta **0**.

### Fresh focused and shared shard results
The seven-file chips command recorded below now passes **116/116**; the five-file photo-grid focused command passes **50/50**. Logs: `/tmp/chips-grid-closeout/chips-focused.log`, `grid-focused.log`.

Each shard was invoked once using `bunx vitest run --maxWorkers=2 --shard=N/4`:
| Shard | Passed | Failed | Executed | Files |
|---|---:|---:|---:|---:|
| 1/4 | 1,984 | 0 | 1,984 | 167 passed |
| 2/4 | 1,824 | 1 | 1,825 | 166 passed, 1 failed |
| 3/4 | Not run | — | — | Stop rule |
| 4/4 | Not run | — | — | Stop rule |

Executed combined: **3,808 passed + 1 failed = 3,809 tests / 334 files**. Full-suite result remains unavailable. Last green baseline **7,607/664** + tight-chips **3 tests/1 file** + photo-grid **22 tests/2 files** = expected scope **7,632 tests/667 files**; this is a reconciled expectation, not an executed full-suite total. The assertion repair does not change counts.

**Unexpected failure — stopped, not classified as known:**
```text
FAIL src/test/tourHeroRefinements.test.tsx > Tour hero refinements > renders the Needs gross as a separate untruncated white figure and omits leading/level picks
AssertionError: expected  to have a length of 1 but got +0
src/test/tourHeroRefinements.test.tsx:98:19
expect(lines).toHaveLength(1);
Expected: 1; Received: 0
```
The test still expects the removed chip NEEDS subtree. It was not changed, skipped or rerun. Repair is outside this one-line authorisation. No FW1 meta-line failure appeared in the executed shards. Logs retained at `/tmp/chips-grid-closeout/shard1.log` and `shard2.log`.

### 320px verification completed independently of the test blocker
Browser rendered **actual HeroBoardSection, CardFeed and LightCardFeed → FeedCard → FeedPhotoGrid** at **320×844**, using fixture data and real global CSS; network hooks, side-effect modules, secondary panels and virtual-list mounting were isolated in a temporary harness. No production changes, sign-in or guest creation. This verifies the real row/feed-list/card composition, not authenticated page data or complete page chrome.
- **Overview picks:** three chips, each **46px**, confined to x20–300; long surnames have `text-overflow: ellipsis`, 37px visible width versus 174px content width. No horizontal overflow.
- **Overview movers:** three chips, each **46px**, confined to x20–300; long surnames ellipsise, 36px visible width versus 174px content width. No horizontal overflow.
- **Clubhouse, 5 upright photos:** actual CardFeed, grid320×400px, gap2px, cap539px, feed scrollWidth/clientWidth320/320.
- **Clubhouse, 12 wide photos:** actual CardFeed, grid320×287.344px, gap2px, cap539px, feed scrollWidth/clientWidth320/320.
- **Business feed, 5 upright photos:** actual LightCardFeed with business author and mediaFirst, grid320×400px, gap2px, cap539px, feed scrollWidth/clientWidth320/320.
- **Business feed, 12 wide photos:** actual LightCardFeed with business author and mediaFirst, grid320×287.344px, gap2px, cap539px, feed scrollWidth/clientWidth320/320.

Final run: **zero page errors**. Screenshots inspected: chip names visibly ellipsise and +1/+8 photo overlays render. Fixture/results/screenshots: `/tmp/browser/chips-grid-closeout/`. Earlier temporary-harness dependency/identifier/subscription errors were resolved only in `/tmp`; final measurements above come from the successful run. Real-device/live-page reads and fullscreen interaction remain outside this fixture check. Latest preview log: **build OK**, `2026-11-07T19:11:10Z`.

The original stopped build report below is retained as history; the repaired flex blocker and previously unrun 320px checks are superseded by this section.

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