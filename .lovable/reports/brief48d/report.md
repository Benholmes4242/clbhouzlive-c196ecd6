# Brief 48D — final report

28 November 2026. **Closed: four shards passed, requested screenshots retained.** App/test corrections were already committed as `24ae14a1e9` (Fixed device-check on slides). This continuation changes documentation/evidence only; no further application, test, function or configuration edits.

## 1. Files changed

Corrections in `24ae14a1e9`:
- `src/features/tourhub/components/overview-v3/HybridPhotoFrame.tsx` — removed champion face-ring class; shared `HERO_CONTENT_TOP` / `HERO_CONTENT_BOTTOM` flow geometry.
- `src/features/tourhub/components/overview-v3/HybridOverviewShell.tsx` — matching shared photo geometry and current-round-only loading rows.
- `src/features/tourhub/components/overview-v3/OverviewHybridSections.tsx` — live columns/current round only and stored-round value mapping for live/final boards.
- `src/features/tourhub/components/overview-v3/OverviewHybridRecap.tsx` — shared content-sized points tracks, narrow BEHIND omission.
- `src/features/tourhub/components/overview-v3/hybridOverviewRules.ts` — current-round selection and stored-round reader.
- `src/styles/tour-overview-hybrid.css` — centred tiles, `10px 8px` padding, no tile minimum height; ring stays left and adjacent copy fills/centres its space; content-flow photo; no champion ring shadow; shared points subgrid tracks.
- `src/test/tourOverviewHybrid48.test.tsx` — three authorised parameterized round-column cases rewritten, same case count.
- `src/test/tourOverviewHybrid48d.test.tsx` — eight new round-authority cases.
- `roadmap.md` — task tracking.

Close-out: this report, screenshot index, 27 screenshot PNGs, geometry/capture manifests and logs, four shard logs and focused log; closure notes in the existing Briefs 48–48C / 49 reports and roadmap.

## 2. Rewritten tests, by name

Only `src/test/tourOverviewHybrid48.test.tsx` changed an existing test. Its 37 executed cases remain 37; none deleted.

| Old case name | New case name | Old assertion | Replacement | Why |
|---|---|---|---|---|
| live round 1 selects only previous/current columns | live round 1 selects only the current round column | `expect(hybridBoardRounds(1, false)).toEqual([])` | Same `[]` | Round 1 still has THRU/TOT and no separate R1; parameterized name now describes the new rule. |
| live round 2 selects only previous/current columns | live round 2 selects only the current round column | `expect(hybridBoardRounds(2, false)).toEqual([1, 2])` | `expect(hybridBoardRounds(2, false)).toEqual([2])` | Brief 48D removes the previous-round column at every width. |
| live round 4 selects only previous/current columns | live round 4 selects only the current round column | `expect(hybridBoardRounds(4, false)).toEqual([3, 4])` | `expect(hybridBoardRounds(4, false)).toEqual([4])` | Same explicit current-round-only correction. |

No other existing tests were rewritten, renamed or deleted. No protecting test was changed for the hero height, ring or fixed points columns: the source audit located only the parameterized round rule above. Visual styling/overflow is recorded through real-browser evidence, not a vacuous jsdom layout assertion.

## 3. Blank R2: cause and correction

`HybridBoard` formerly used `todayFromEntry(e, n)` for every Rn column. In `src/features/tourhub/leaderboard/BoardTable.tsx`, that helper prioritises TODAY. When `today` exists and `today_round !== n`, it returns null **before** reading `round_1..round_4`. Thus a row whose TODAY belongs to round 3 suppresses the available `round_2` value when rendering R2. Without a `today_round`, TODAY could also incorrectly repeat across historical columns. This was a TODAY-vs-stored-round mapping error, not a missing `round_2` field or an after-R3 round-number error.

The overview-only `hybridRoundValue` reads `[round_1, round_2, round_3, round_4][n - 1]` first (including zero), and uses the unchanged canonical TODAY helper only when that stored value is absent. The tournament page and shared helper were not modified. Live selects only Rn (none in round 1); between rounds after R3 selects R3 and retains the existing next-tee THRU rule.

**The final leaderboard uses the same corrected mapping: R1–R4 are all populated in the provider-shaped test**, despite TODAY belonging to R3: `[-4, -3, -5, -2]`. The test also confirms the formerly blank R2 is `-3`, a stored zero survives, and absent rounds never borrow another round's TODAY. This is supplied test data, not a claim that every historical production row has all four rounds. Actual missing values remain empty.

Real Australian PGA after-R3 capture shows populated R3 values (`−3`, `−7`, `−2`, `−7` for the first four rows), no R2 column and next-round tee times under THRU at 390/375/320.

## 4. Test results and exact delta

Last accepted full baseline: **10,859 tests / 960 files**, zero failures (Briefs 48–48C and 49 combined).

Sequential commands, same app/test state at `24ae14a1e9`; shards 1–3 ran in the preceding turn, shard 4 completed this continuation. No app/test edits occurred between them.

```text
npx vitest run --maxWorkers=2 --shard=1/4
npx vitest run --maxWorkers=2 --shard=2/4
npx vitest run --maxWorkers=2 --shard=3/4
npx vitest run --maxWorkers=2 --shard=4/4
```

| Shard | Passed / executed tests | Passed files | UTC start | Duration |
|---|---:|---:|---|---:|
| 1 | 2,611 / 2,611 | 241 | 10:06:47 | 362.33s |
| 2 | 2,575 / 2,575 | 241 | 10:15:07 | 375.91s |
| 3 | 2,771 / 2,771 | 241 | 10:22:42 | 327.94s |
| 4 | 2,910 / 2,910 | 238 | 10:30:32 | 322.71s |
| **Total** | **10,867 / 10,867** | **961** | | |

**Zero failures; no pre-existing failures carried. Delta +8 tests / +1 file**, entirely `src/test/tourOverviewHybrid48d.test.tsx`:
1. live R1 contains no previous round
2. live R3 contains no previous round
3. live R4 contains no previous round
4. between rounds after R3 reads the completed R3 value
5. R2 remains available when TODAY belongs to R3
6. final R1–R4 all read their own stored values despite TODAY round mismatch
7. a stored zero is preserved ahead of a different TODAY value
8. missing stored current round may use matching TODAY, never another round

The three authorised rewritten cases have zero count delta. Per-shard counts moved because adding a file changes shard allocation; only the combined suite total is compared with the baseline. Logs are `shard-1.log` through `shard-4.log`. Focused run: **47/47 tests, 3/3 files**, covering the 37 Brief 48 cases, 8 new cases and 2 unchanged photo-navigation cases (`focused.log`).

The previous turn observed build OK after corrections at 10:06:30 UTC. No manual build/typecheck was run in this documentation-only continuation; current observability mount did not expose a fresh build log. No app changes were made after that observed build.

## 5. Screenshots and findings

All requested cases were available as **real public overview data**, not fabricated results. Capture width/height: 390×1800, 320×1800; 375×1800 supplied as additional responsive evidence. No stitched full-page screenshots.

| View | Actual event/data | Files at each width 390, 375, 320 |
|---|---|---|
| Australian PGA live / between rounds | BMW Australian PGA Championship, ROUND 3 COMPLETE, Nicolai von Dellingshausen −16 | `australian-pga-{width}-hero.png`, `australian-pga-{width}-board.png` |
| Skins final | The Farmers Insurance Skins Game, Jackson Koivun 7 skins, last 4 in a playoff | `skins-final-{width}-hero.png`, `skins-final-{width}-board.png` |
| Champions recap / points | 2026 Charles Schwab Cup, Stewart Cink; points 4,999,830 / 4,357,828 / 2,789,778 / 2,168,567 / 1,999,921 | `champions-recap-{width}-hero.png`, `champions-recap-{width}-board.png` |
| Korn Ferry recap | 2026 points list, Ross Steelman; 2,221 / 2,191 / 1,618 / 1,580 / 1,533 | `korn-ferry-recap-{width}-hero.png`, `korn-ferry-recap-{width}-board.png` |
| Upcoming | Grant Thornton Invitational, 11–13 December, Tiburon Golf Club | `grant-thornton-upcoming-{width}-hero.png` |

Screenshot files are under `screenshots/`; [Screenshot-index.md](Screenshot-index.md) lists all 27. The first capture script used a nonexistent “KFT” button label; the separate capture used the actual “KF” control and obtained all Korn Ferry widths. No app/test change was needed.

Recorded browser geometry:
- Root client width equals scroll width at 390/375/320 for the initial four real slides; board-cell checks record no right-edge overflow, including Champions' seven-digit PTS/BEHIND. Korn Ferry board-cell checks likewise record none.
- BEHIND displays at 390/375 and is hidden at 320, including its heading. Shared subgrid tracks align widest values across all rows.
- All inspected tiles use `text-align:center`, `padding:10px 8px`; each row has equal tile heights. Wrapped “BIGGEST POT” is centred at 320. No tile minimum height is declared. Ring tile left-ring geometry remains in the shared tile presentation; the current between-rounds/final/upcoming captures do not exercise a live finished-ring tile.
- Champion face wrappers have class `ov48-face`, computed shadow `none`; the shared avatar is still passed `hideRing`. Gold kicker/trophies remain visible.
- Kicker offset is **193.890625px** for all captured slides, sourced directly from the same hero geometry imported by CoursesPageHero. No fixed 460px height remains. Photos grow with their own content: e.g. 390px Australian/Skins 425.33px, upcoming 379.98px; recap may exceed the former fixed height when content wraps (Champions at 320: 468.91px). This is intentional content flow, not a retained fixed height.

Responsive real screenshots verify the five requested slides. PGA/LPGA/DP World season-recap point lists and team-final champion presentation were not newly captured; they share the corrected components, but no additional live-data/manual acceptance is claimed for those states.

## 6. Related brief closures and constraints

Briefs 48–48C and 49 were already closed in `43be3353fa`; their separate final reports and labelled real/test-data screenshots are retained and included with this delivery. Brief 48D supersedes only its matching geometry/ring/column details. Earlier 460px / previous-round screenshots remain historical evidence, not current acceptance; this report and fresh screenshots are authoritative for those corrections.

`process-push-queue` was successfully deployed for Brief 49 with source SHA-256 `04b15a2dba54222272ca421d0ac32d2cbec18d20922c9c7a1e889efde1b25584`. No redeployment or push was sent in Brief 48D or this continuation. Brief 49 screenshots remain explicitly simulated test-data push landings (post loaded and missing), not native production receipt/tap or authenticated account verification.

No SQL, migrations or migration files; no RPC/edge-function changes; `feed_config` untouched, `round_pool_cap` stays 30. No guest browsing, review wizard, news or round-plot changes; no native/Median config changes. No security “Fix all”; no new security scan was run, so no new security-findings claim is made.
