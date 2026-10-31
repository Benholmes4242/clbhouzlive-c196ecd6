# Tour hero refinements — partial completion, data stop on 4(a)

## Follow-ups and revised 13:13 ruling — STOP on one new test

The earlier approved full-field/play-evidence implementation passed its initial tests and full suite, but fresh real guest reads established Baddeley and Moore both occur in the actual R1 and R2 draws. Ben's revised ruling replaces that rule entirely. Production now checks only the selected leaders' base-round group; every member needs the round's card, scoped 18/F, or MC/CUT/WD/DQ. N+1 must be immediately next, within total rounds, published, and contain a current position-1 leader. `LeadersGroup` reads actual next-round joined groups before deciding. No draw, tee sheet, status or outside-field row is changed.

### Fresh guest joins and real proof
Mexico Open guest reads returned HTTP 200, no read error:
| Round | Tee rows | Nested links / resolved players | Empty groups |
|---|---:|---:|---:|
| 1 | 40 | 121 / 121 | 0 |
| 2 | 40 | 123 / 123 | 0 |
| 3 | 23 | 68 / 68 | 0 |
Baddeley and Moore each still have score 0, position/thru/status/today/today_round/all round cards null; both joined actual rounds 1 and 2. No invented status applied.

Before the revised edit, real 390×844 `/tourhub` showed R3 hero tee times (Novak 17:51, other leaders 17:40/17:51), no page errors, and R2 Finished leaders because the old full-field rule preserved those two draw blockers. Screenshots captured and inspected: `/tmp/browser/two-followups/tour-real-390.png`, `leaders-real-390.png`, `mock-390.png`. These are real guest/source-reference captures, not fabricated groups. Revised R3 pre-tee screenshot is **not yet verified**, because the new test failure stopped verification. A later attempted reader-audit script was interrupted by the incoming revision and hit a missing old upload path; it establishes no additional reader results.

### Other sr_tee_time_players readers
Browser readers: `useTeeTimesAll.ts` (AllTeeTimesSheet, TeeTimesRail/FirstGroups, TournamentPage, HybridHero pre-start, OnTheCourse, MiniBoard hero tees, LeadersGroup); `usePickTeeTimes.ts` (picks tee line); `useTournamentTeeTimes.ts` (round-1 teaser); `useTourHubData.ts:712` (pre-tournament LeaderboardTab enriched tees); `useAIPredictions.ts:577–600` (confirmed-field fallback).
The shared full-draw read and hero cells are confirmed populated. Separate picks/teaser/enriched/fallback reads and each dependent UI were **not individually verified** before the stop; do not claim all surfaces show players. Server readers remain schedule-predictions, generate-predictions and tournament-live-sync/teeAlerts; not executed/modified. sportradar-sync is a writer, untouched.

### Exact surviving failure
Command: `bunx vitest run src/test/ep5Completion.test.tsx src/test/tourRoundHandoverEvidence.test.ts src/test/cb58LeadersGroup.test.tsx --maxWorkers=2`.
Result: **100 passed / 1 failed / 101 total**, three files. EP5 39/39; revised handover 14/14; CB58 47/48.
`src/test/cb58LeadersGroup.test.tsx:74:92`, `CB58 pure leaders group rules > only the selected leaders group gates handover, not another leaders group`:
```
AssertionError: expected 1 to be 2 // Object.is equality
- Expected
+ Received
- 2
+ 1
```
The fixture's unfinished d/e group contains two current leaders versus the finished a/b/c group's one. Existing most-leaders selection therefore correctly selects the unfinished group; the rewritten expectation of 2 is wrong. No post-failure test or production correction made. Proposed authorized correction: retain expected 1 and describe the selected unfinished most-leaders group (or explicitly change the fixture so the finished group is selected). Full revised-suite and revised visual verification are pending authorization. No pre-existing failure at this task's start; **BE2 historical from-your-club failure passed 33/33**, file untouched.

### Counts and exact test changes
Last baseline 4,915/496. Added EP5 three cases and `tourRoundHandoverEvidence.test.ts` fourteen cases → **4,932/497**, no count lost.
Before the revised ruling:
- `bunx vitest run --maxWorkers=2 --shard=1/2`: 2,419/2,419, 249 files.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: 2,513/2,513, 248 files.
- Full **4,932/4,932**, no failures/unhandled errors. This is **not** a full-suite result for the later revised edit.

`cb58LeadersGroup.test.tsx` remains 48 tests. Revised rule implicitly authorizes these named retargets, reported explicitly:
- `keeps finished groups until the next draw is published`: outside afternoon row expectation `toBe(1)` → `toBe(2)`; no-draw `toBe(1)` retained.
- `does not switch when another leaders group is unfinished` → `only the selected leaders group gates handover, not another leaders group`: `toBe(1)` → `toBe(2)`; this is the surviving incorrect fixture expectation above.
- `CB58.1 keeps Round 1 finished leaders while the afternoon field plays despite a published R2 draw` → `Tour 4(a) advances a finished leaders group despite unfinished players elsewhere`: round `toBe(1)` → `toBe(2)`; state query `finished` → `before`.
- `CB58.1 moves to Round 2 before-tee state only when the whole field finishes R1` → `Tour 4(a) moves to Round 2 before-tee state when the selected group finishes R1`: assertions retained.
- `CB58.1 suspended unfinished R1 stays on R1 overnight regardless of early current-round advancement` → `Tour 4(a) unfinished selected-group player stays on R1 overnight despite scheduled advancement`: delayed outside player replaced with unfinished b and finished c inside selected group; `toBe(1)` retained.
- `CB58.1 CUT/MC/WD/DQ/MDF/DNS without R2 cards and scoreless entries do not block R2 to R3` → `Tour 4(a) terminal and scoreless rows outside the selected group do not block R2 to R3`: `toBe(3)` retained; scoreless fixture position/thru made null during earlier evidence rule.
- `CB58.2 unstarted afternoon tee-sheet players (no row or score null) keep Round 1 despite a published R2 draw` → `Tour 4(a) unstarted other draw players no longer gate the selected group`: `toBe(1)` → `toBe(2)`.
- `CB58.2 afternoon tee-sheet players finished moves to Round 2` → `Tour 4(a) completed selected group moves to Round 2 with the whole draw preserved`: `toBe(2)` retained.
- `CB58.2 a WD tee-sheet player with no card does not block` → `Tour 4(a) a WD elsewhere in the draw does not block`: `toBe(2)` retained.
All direct selector tests now supply an actual next draw with current leader membership; unrelated assertions untouched.

The new `tourRoundHandoverEvidence.test.ts` was rewritten under the revised rule, keeping 14 cases: Saturday placeholders in other real draws advance to 3 and group state before; Friday no draw retains 2/finished; early PGA R2 with unfinished R1 retains 1; on-course leader retains 2; four MC/CUT/WD/DQ selected-member cases advance to 3 without mutating status; zero round card advances; scoped 18 advances; stale earlier thru retains 2; unknown selected member retains 2; next draw without leader retains 2; no immediate N+1 retains 2. Earlier 14 full-field/evidence cases were superseded, not silently removed: Saturday placeholder case, real evidence-free draw blocker, missing real draw blocker, four evidence-only participation cases, six terminal cases, COMPLETE evidence case. Their former assertions were advance 3, block 2, block 2, block 2 then finished 3, terminal advance 3, COMPLETE block 2 respectively; replaced because outside players no longer gate this section and completion terminal set is now specifically MC/CUT/WD/DQ.

Latest automatic validation `2026-10-31T13:15:19Z — build OK`. No manual build/typecheck run. Changed source: completionRules.ts, EditProfile.tsx, leadersGroupRules.ts, LeadersGroup.tsx. Tests: ep5Completion.test.tsx, cb58LeadersGroup.test.tsx, new tourRoundHandoverEvidence.test.ts. Docs: this report, LINKED_NO_INDEX_REPORT.md, roadmap.md; memory records revised rule. No SQL, migrations, RPC/deployed edge edits, feed_config or native/Median changes; round_pool_cap remains 30.

## 4(a) unblock recheck — 31 October 2026, 10:51–11:05 UTC

**Still blocked in the connected preview.** Fresh guest sessions on `http://localhost:8080/tourhub` read the connected project `ybxkehyomcakqjvuhnna`. `session.user.is_anonymous` was true. The canonical nested GET returned HTTP 200 without a query error, but no player links. A separate uncached REST GET (`cache: no-store`, Cache-Control: no-cache) returned HTTP 200 with the same zero links; a direct guest GET of `sr_tee_time_players?select=player_id,tee_time_id&limit=1` returned HTTP 200 and `[]`. No SQL or policy modification was run. This confirms observed guest visibility, not the installed policy definition or underlying admin-visible row count. Ben reports the public SELECT policy was added; the preview result does not yet reflect populated player joins.

Event: VidantaWorld Mexico Open, `fa65c3bc-18ef-4058-8048-cf61808fea78`.

| Round | Tee-time rows | Nested links | Resolved players | Empty groups |
|---|---:|---:|---:|---:|
| 1 | 40 | 0 | 0 | 40 |
| 2 | 40 | 0 | 0 | 40 |
| 3 | 23 | 0 | 0 | 23 |

**No production code or tests changed in this recheck.** The initial manual uncached diagnostic accidentally referenced a non-exported key and returned 401 Invalid API key; the diagnostic was corrected to use the running client's configured public key. The successful uncached results above supersede that instrumentation error. Session tokens were never printed or saved in the evidence JSON. Temporary scripts/read results live under `/tmp/browser/tour-unblocked`.

### Saturday blocker records and proposed rule — not applied
Guest-readable leaderboard data still has:
- Aaron Baddeley: score 0, strokes 0, position null, status null, thru null, today/today_round null, all four round cards null; updated_at `2026-10-29T01:55:08.038865+00:00`.
- Taylor Moore: identical score/strokes/position/status/thru/today/card shape; updated_at `2026-10-29T13:50:06.147368+00:00`.
- Both raw payloads contain round sequences 1 and 2 with score 0, strokes 0 and thru 0, with every count zero. There is no terminal-status evidence in either row.

Current `leadersShownRound` includes both because total score is non-null, then neither resolves to F. They are potential independent blockers, but the unreadable draw prevents verifying their real tee-sheet membership and reproducing the full Saturday field. No player discarded, status inferred, selector changed or fabricated Saturday regression added.

**Proposed narrow rule for Ben's ruling after readable draw verification:** always retain every base-round tee-sheet player as a completion blocker unless an existing canonical terminal status exempts them. For leaderboard-only rows absent from that real draw, do not treat a zero-only placeholder as proof of participation: require actual play evidence (a completed round card, or positive thru/strokes) before adding it to the completion union. Zero is a valid score and must never be excluded on its own. This preserves CB58.2's real unstarted tee-sheet blockers and does not invent a terminal status. If either Baddeley or Moore appears in the base draw, this proposed rule deliberately does not unblock them; authoritative feed correction/ruling is then required.

### Reader audit
All browser readers below remain unconfirmed as populated: the shared nested player read is still empty. No claim that member displays are fixed; authenticated member checks remain unavailable (`external_unmanaged`).
- `tournament-v2/data/useTeeTimesAll.ts:23–49`: tournament tee-times rail/full AllTeeTimesSheet, overview OnTheCourse, LeadersGroup and MiniBoard scheduled-round cells. Per-event/per-round chronological full draw.
- `tournament-v2/data/usePickTeeTimes.ts:12–31`: picks' tee-time map/tee line, filtered to selected player IDs and round via the inner link join.
- `hooks/useTournamentTeeTimes.ts:23–44`: round-1 teaser, first eight tee rows with joined player names.
- `hooks/useTourHubData.ts:712–744`: enriched tee-time reader, optional round filter. Includes joined link rows/player detail.
- `hooks/useAIPredictions.ts:577–600`: confirmed-field fallback when no leaderboard is available; direct links filtered to tournament tee-time IDs.
- Server readers (not member UI and not executed/modified): `schedule-predictions/index.ts:101–117` field-size links; `generate-predictions/index.ts:155–164,317–324` field count/confirmed entrants; `tournament-live-sync/teeAlerts.ts:38–40` joined alert names. Their elevated access behavior is not established by the guest failure.
- `sportradar-sync/index.ts:1241–1245` is a writer, not another player display; untouched.

### Proof and full suite
Real Chromium 390×844 `/tourhub` screenshot `/tmp/browser/tour-unblocked/initial.png` confirms empty scheduled R3 board cells and an absent leaders group, with no page errors. The tee-filled hero/pre-round leaders proof beside `tour-hero-signed-off.html` cannot truthfully be taken while the real draw is unreadable; no fixture was substituted.

- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,372/2,372**, 245 files.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,496 passed / 1 failed / 2,497 total**, 245 files.
- Full: **4,868 passed / 1 pre-existing failure / 4,869 total**, 490 files, zero unhandled errors. Against requested 4,828/489: **+41 cases/+1 file**, all intervening `be3BusinessWhereContact.test.tsx`; no additions/removals/renames/rewrites in this task. Last reported BE3 total 4,869/490 is unchanged.
- Exact existing failure: `src/test/be2BusinessPreview.test.tsx:76:263`, `BE2 immediate editing > makes Name read-only for club`: `TestingLibraryElementError: Found multiple elements with the text: /from your club/`. Already reported by BE3; not edited or rerun after this full-suite failure.
- Latest available automatic build entry: `2026-10-31T10:50:56Z — build OK`. Earlier BE3 TS2367 diagnostics are historical; no manual typecheck was run and no claim of an independent typecheck result is made.

Changed files in this recheck: this report and `roadmap.md` only. All SQL/migrations/deployed functions/RPCs/feed_config/cap/native configuration remained untouched. **STOP: guest player joins still empty, plus the separately owned pre-existing BE2 test prevents an all-green suite.** Next required action: Ben verify the public-read policy applies to this connected project and that the guest's table SELECT is not restricted by another policy; no further selector change before draw membership and the proposed rule can be decided.

## 4(a) read-only published draw check — first
Checked 31 October 2026 through Supabase REST GET only, with the existing publishable client key. No SQL was run. All reads returned HTTP 200. Below: UTC first/last tee time and max created_at; counts are tee-time rows, not players.

| Live event | Round | Rows | First UTC | Last UTC | Max created_at UTC |
|---|---:|---:|---|---|---|
| Maybank Championship | 1 | 26 | Oct 28 23:15 | Oct 29 01:27 | Oct 27 15:00:12.388092 |
| Maybank Championship | 2 | 26 | Oct 29 23:15 | Oct 30 01:27 | Oct 29 07:42:07.240669 |
| Maybank Championship | 3 | 26 | Oct 30 23:15 | Oct 31 01:27 | Oct 30 07:42:05.810906 |
| Maybank Championship | 4 | 26 | Oct 31 23:15 | Nov 1 01:27 | Oct 31 08:12:05.711496 |
| Simmons Bank Championship | 1 | 17 | Oct 30 14:00 | Oct 30 17:12 | Oct 29 18:00:10.655065 |
| Simmons Bank Championship | 2 | 17 | Oct 31 13:00 | Oct 31 16:12 | Oct 30 23:12:05.106050 |
| VidantaWorld Mexico Open | 1 | 40 | Oct 29 13:05 | Oct 29 19:24 | Oct 27 21:00:09.265945 |
| VidantaWorld Mexico Open | 2 | 40 | Oct 30 13:05 | Oct 30 19:24 | Oct 27 21:00:17.283920 |
| VidantaWorld Mexico Open | 3 | 23 | Oct 31 15:50 | Oct 31 17:51 | Oct 31 01:12:09.229099 |

Mexico Open's R3 rows **exist**, but the exact canonical nested player read returns `players: []` for **all 103 tee-time rows**. Rechecked through the running preview's actual guest session: same result, no request error. This does not establish whether rows are missing or hidden by server permissions. In that real state useTeeTimesAll filters every group out at `src/features/tourhub/tournament-v2/data/useTeeTimesAll.ts:86`; LeadersGroup cannot select the Saturday final group. The source assumes available player joins, which this environment lacks: **STOP on 4(a), no workaround and no claim of fixing Ben's phone state**. A signed-in member read is unavailable (`external_unmanaged`). Ben's phone shows a group while this guest preview exposes none, so the phone state cannot be treated as reproduced.

Further read-only evidence: Novak has R1 −4/R2 −10, today_round 2, thru 18, no R3. Baddeley and Moore have score 0 but no position, cards, thru or terminal status. `leadersShownRound` includes every non-null score in its full-field union; these can also block advancement. Existing CB58.2 explicitly preserves unstarted tee-sheet players as blockers. No change to this handover rule without a verified member draw/field: do not invent terminal statuses or discard actual tee-sheet players.

Draw loading in existing source: `tournament-live-sync` calls `sportradar-sync` action `tee_times`, which invokes `syncTeeTimes` and upserts tee rows and their player links. In-play next-round refresh is UTC minutes **12 and 42** (30-minute cadence); pre-event cadence is every **3 hours at minute 00**. Hosted schedule not independently verified; no deployed code changed.

## Completed diff
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx`: hero-only local POS24/round32/TODAY40/TOT40/gap4/padding20; numeric headers/cells and live shape centred; name tracking zero, POS12.5/700. Shape width remains44. Scheduled entirely unscored round queries reuse useTeeTimesAll; player-id matching uses the same formatTimeHm24 as pickTeeText, 11px/600 WHITE_ALPHA_45. Scores win; missing/delayed/complete conditions handled. Full board/panel appearance unchanged.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`: Needs label + separate white gross figure, 4px gap, uppercase10/700/0.06em, no truncation; existing visibility retained. Mock picks kicker11/800/0.16em, intro14/1.45, cards20px gutter, board-to-kicker22px and no bottom padding before leaders22px.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx`: stable position display order, centred numeric cells, gap4 and20px side inset; top gap22px; name tracking0. Base/shown/draw logic unchanged under 4(a) stop.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/leadersGroupRules.ts`: added non-mutating leadersPositionOrder only, MC/CUT/WD last, stable ties.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/leadersGroupTokens.ts`: grid `24px minmax(0,1fr) 40px 40px 40px`, gap4.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/SituationBand.tsx`: sentence bottom seam15→12px; required to set sentence/header spacing at its owner. Nothing else changed there.
- `public/locales/{en,en-XA,de,es,ja,ko}/tourhub.json`: overview.picksNeeds = Needs in every locale. Existing picksToReach preserved in en/en-XA; **no remaining source consumer** including PicksSheet (which has its separate needs sentence).
- `src/test/tourOverviewDesignA.test.ts`, `src/test/tourOverviewPicksChipsFullBoard.test.tsx`: authorised expectation updates below.
- `src/test/tourHeroRefinements.test.tsx`:12 new tests below.
- `roadmap.md`, this report and memory `mem://features/tourhub/hero-refinements` with index link: requirements/result.

BOARD_GEOMETRY and BoardTable.tsx unchanged. No SQL, migration, feed_config, RPC/edge, cap or native/Median changes; no publication. No new negative tracking. Existing untouched StatCell/movement negative tracking retained because “nothing else moves”; removed negative tracking on both requested player-name sites. System font remains, not the reference's retired Geist; current tour-green remains, not a new mock override. Brackets preserve right2 and existing top/bottom geometry.

## Existing test changes — exact old → new
No tests deleted. One renamed case; inventory of both edited files stays61 and15.

In tourOverviewDesignA.test.ts:
1. “draws a round column per played round, and none at all when the board carries totals with no round breakdown”: `expect(playedHeader?.style.gridTemplateColumns).toBe('24px minmax(0, 1fr) 26px 26px 26px 40px')` → same assertion with `'24px minmax(0, 1fr) 32px 32px 32px 40px'`.
2. “live round two takes the mock grammar POS | PLAYER | TODAY | SHAPE | TOT”: `expect(header?.style.gridTemplateColumns).toBe('26px minmax(0,1fr) 40px 44px 42px')` → `'24px minmax(0,1fr) 40px 44px 40px'`.
3. “live round two renders no MOV track before POS”: `expect(header?.style.gridTemplateColumns.startsWith('26px minmax(0,1fr)')).toBe(true)` → startsWith `'24px minmax(0,1fr)'`.
4. Renamed “the hero board draws round cells at BoardTable's round-cell width” → “the hero board draws independent 32px round cells without changing BoardTable”. `expect(header?.style.gridTemplateColumns).toContain(`${BOARD_GEOMETRY.cell}px ${BOARD_GEOMETRY.cell}px`)` → `expect(header?.style.gridTemplateColumns).toContain('32px 32px')`. Total-width assertion retained. Why all four: explicitly signed-off independent hero geometry; full-board assertions untouched.

In tourOverviewPicksChipsFullBoard.test.tsx, “the to-reach line renders as one line only when its condition holds”:
- `expect(line.children).toHaveLength(0)` → `expect(line.children).toHaveLength(2)`; label and gross now separately styled.
- `expect(line.style.textOverflow).toBe('ellipsis')` → `.toBe('')`; brief explicitly removes truncation. Visibility/nowrap/early-window assertions unchanged.

## Added12 tests — tourHeroRefinements.test.tsx
1. centres every round and total header/cell on independent 32px tracks
2. centres live TODAY, shape and TOT without resizing the full board
3. shows a known next-round tee time in its centred dim 11px cell
4. keeps a passed tee time when the round has not started
5. renders the score instead of a tee when that player has a round score
6. keeps an unknown tee time blank
7. never reads or prints tee times on completed events
8. does not enable a tee read when every visible player has a score
9. never requests a played round for a missing score or a non-hero board
10. renders the Needs gross as a separate untruncated white figure and omits leading/level picks
11. sorts leaders by position stably with MC/WD last without changing the draw
12. aligns the leaders headers/rows and holds thru/today empty before tee-off

No Saturday advance regression added: 4(a) remains data-blocked, not a verified client fix.

## Commands and totals
- `bunx vitest run src/test/tourHeroRefinements.test.tsx src/test/tourOverviewDesignA.test.ts src/test/tourOverviewPicksChipsFullBoard.test.tsx src/test/cb58LeadersGroup.test.tsx src/test/cb57HeroBoardRemovals.test.tsx src/test/pickTees24Hour.test.tsx --maxWorkers=2`: **149/149 across6**.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,372/2,372 across245**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,456/2,456 across244**.
- Full **4,828/4,828 across489**, zero failures/unhandled errors. Last reported **4,816/488 +12 named tests/1 file =4,828/489**. Brief baseline **4,783/487 +31 BE2 cases/1 file +2 BE2.1 cases +12 Tour cases/1 file =4,828/489**. No pre-existing test failure at start or end.
- Automatic build OK `2026-10-31T09:59:22Z`; manual builds/typechecks not run.

## Phone-size proof and limits
Chromium390×844 running `/tourhub`: centred columns measured `24px 170px 32px 32px 32px 40px`, numeric header alignments all centre. Real Needs figures66/64 present. No page errors. Live between-round screenshot `/tmp/browser/tour-hero/finished-live-preview.png`; reference `/tmp/browser/tour-hero/signed-off-reference.png`. Initial reference file navigation failed (Playwright locator timeout); reading the HTML into the page succeeded on retry.

Published draw player joins are empty in the preview, so **actual tee-filled board and before/during leaders screenshots are blocked**; actual on-course board proof is not available during this between-round state. These are unit-tested states only, not authenticated member end-to-end proof. No fixture or invented group substituted for the missing draw. The signed-off mock example tie order differs from the server's current tie order; hero tie order preserved. Finished live screenshot has picks near nav; proof captures the actual page, not a fabricated standalone layout.