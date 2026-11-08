# Also this week — follow-up validation passed

## Approved assertion corrections — final result
Only `src/test/alsoWeekRebuild.test.tsx` test code changed in this follow-up; no component changes. No tests deleted, renamed or added; the same three cases were corrected under explicit approval:

- **one followed player uses singular field sentence**: old `expect(v.container.querySelector('.also-yours')?.textContent).toBe('1 of your players is in the field');`; new `expect(v.container.querySelector('.also-yours > span:last-child')?.textContent).toBe('1 of your players is in the field');`. Reason: target the sentence, not avatar initials.
- **multiple followed players use plural field sentence and three faces maximum**: old `expect(v.container.querySelector('.also-yours')?.textContent).toBe('4 of your players are in the field');`; new `expect(v.container.querySelector('.also-yours > span:last-child')?.textContent).toBe('4 of your players are in the field');`. Reason: same sentence-only fix. Retained exactly `expect(v.container.querySelectorAll('.also-stack .also-avatar')).toHaveLength(3);`.
- **ranking falls use dim not danger and rises retain TREND_UP**: replaced old `expect((v.container.querySelector('[data-movement-tone=fall]') as HTMLElement).style.color).toBe('var(--tour-board-dim)');` with `expect(fall).toHaveAttribute('data-movement-tone','fall');`, `expect(rise).toHaveAttribute('data-movement-tone','rise');` and `expect(fall.style.color).not.toBe(normalizeColor(DANGER));`. Retained the rise check, now written `expect(rise.style.color).toBe(normalizeColor(TREND_UP));`. Reason: jsdom drops CSS-variable colour values; attributes verify polarity, and a red inline fall still fails the negative assertion. Added the existing DANGER token import only.

### Final commands and inventory
- `bunx vitest run src/test/alsoWeekRebuild.test.tsx src/test/alsoWeekSection.test.tsx src/test/alsoWeekReads.test.ts src/test/islandsNav.test.tsx src/test/tourOverviewDesignA.test.ts src/test/tourOverviewMovementColumn.test.ts`: **148/148 passed across 6 files**.
- `bunx vitest run --shard=1/2`: **2,454/2,454 passed across 253 files**.
- `bunx vitest run --shard=2/2`: **2,614/2,614 passed across 252 files**.
- Full suite: **5,068 passed / 0 failed / 5,068 executed across 505 files**, no unhandled errors reported. Against the requested **5,004 tests/502 files** baseline: **+64 tests/+3 files**, entirely `src/test/alsoWeekRebuild.test.tsx` (55), `src/test/alsoWeekReads.test.ts` (3), and `src/test/alsoWeekSection.test.tsx` (6). These are all new test files for this workstream. Inventory before and after this correction is unchanged at **5,068/505**; the earlier 5,039/504 execution predates the +23 rebuild cases and +6 section cases/+1 file.
- Latest automatic preview validation: **2026-11-01T07:02:54Z — build OK**. No manual build/typecheck run.
- Existing `section.png` and `comparison.png` remain the proof; no further screenshots taken. Live data has one live and one finished event. **Two-live, final-round-in-progress and starting-this-week states are unit-test-only**, as are member follows. Live event-tap browser navigation remains unverified; canonical destination is covered by the passing unit test.
- Earlier stops below are historical and resolved. No SQL, migrations, component, RPC/edge/provider/native/Median/feed_config changes in this correction; round_pool_cap remains 30.

## November 1 authorised follow-up
- Applied exactly `initImmediate:false` → `initAsync:false` in the existing provider fixture; no other fixture change.
- In `islandsNav.test.tsx` case **shows the move, sparkline and stats once data settles**, inserted `vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));`. Existing afterEach now calls cleanup then `vi.useRealTimers()`. Neither timers nor requestAnimationFrame is faked. Component unchanged.
- That case's old and new assertion is identical: `expect(dialog.textContent).toContain('▾ 0.2 this month');`. Reason: eliminate the first/second-of-month fixture assumption without weakening the assertion. No cases deleted or renamed.
- Added 23 cases to `alsoWeekRebuild.test.tsx` and new `alsoWeekSection.test.tsx` (6 cases), including all state labels, calculated sentences, two-live count, hidden count, viewed-event exclusion, carousel order/cap and canonical event navigation with `{referrer:{kind:'overview'}}`.
- Added all 33 weekly locale keys to de/es/ja/ko/en-XA, retaining interpolation tokens. English already contained them. de/es/ja/ko remain disabled as before; en ships, en-XA is dev-only. No locale enablement changed.
- AGENTS.md pointer skipped as explicitly instructed; ownership headers retained.
- Automatic preview validation at **06:59:57Z: build OK**, with the earlier type error absent.

### New stop — three new assertions
Command: `bunx vitest run src/test/alsoWeekRebuild.test.tsx src/test/alsoWeekSection.test.tsx src/test/alsoWeekReads.test.ts src/test/islandsNav.test.tsx src/test/tourOverviewDesignA.test.ts src/test/tourOverviewMovementColumn.test.ts`

**145 passed / 3 failed / 148 executed, six files (five passed, one failed).** Both authorised fixes passed. Canonical navigation and heading tests passed. Full-suite shards were not started after these failures, under the stop rule.

```text
FAIL src/test/alsoWeekRebuild.test.tsx > remaining signed-off event states > one followed player uses singular field sentence
AssertionError: expected 'JA1 of your players is in the field' to be '1 of your players is in the field' // Object.is equality
src/test/alsoWeekRebuild.test.tsx:83:249

FAIL src/test/alsoWeekRebuild.test.tsx > remaining signed-off event states > multiple followed players use plural field sentence and three faces maximum
AssertionError: expected 'JAJBJC4 of your players are in the fi…' to be '4 of your players are in the field' // Object.is equality
Expected: "4 of your players are in the field"
Received: "JAJBJC4 of your players are in the field"
src/test/alsoWeekRebuild.test.tsx:84:350

FAIL src/test/alsoWeekRebuild.test.tsx > remaining signed-off event states > ranking falls use dim not danger and rises retain TREND_UP
AssertionError: expected '' to be 'var(--tour-board-dim)' // Object.is equality
src/test/alsoWeekRebuild.test.tsx:88:229
```
The first two accidentally include avatar fallback initials because the query addresses the whole facepile-plus-sentence container. Proposed correction: query `.also-yours > span:last-child` for the sentence, retaining identical expected singular/plural values and the face-count assertion. The third uses jsdom inline CSS-variable parsing, which drops the value; proposed correction: assert the existing `data-movement-tone=fall` structure, with the canonical token mapping checked from source or a browser (not by changing the component). No corrections applied without authorisation.

### Inventory reconciliation and proof
- Last executed full suite remains the previous **5,038 passed / 1 failed / 5,039 executed across 504 files**; this is historical, not a fresh full-suite result.
- Current inventory relative to requested **5,004/502 baseline**: **+64 tests/+3 files = 5,068 tests/505 files**, pending full execution. New files: `alsoWeekRebuild.test.tsx` (55), `alsoWeekReads.test.ts` (3), `alsoWeekSection.test.tsx` (6). Since the previous attempt: +23 in rebuild and +6 section/+1 file. Authorised fixture fixes change no counts.
- Existing `section.png` and `comparison.png` suffice; no new screenshots taken. Today has one live and one finished event; **two-live, final-round-in-progress and starting-this-week states are covered by unit tests only**, not live screenshots. Member follows also remain unit-only.
- No SQL, migrations, feed_config, provider, RPC/edge/native/Median changes; cap remains 30.

---
## Previous attempt (historical)

## Implemented
- Event rows, calculated state sentences, chase, top-three/tie board, followed-player rows, finished winner block, starting facts/draw facepile.
- User ruling: completed slides ended within three days are eligible. Added concrete two-day eligible/four-day excluded tests. Existing live/upcoming filter, carousel order, viewed-event exclusion and four-event cap retained.
- Shared `todayFromEntry`, newly exported `fmtThru`, `leaderSummary`, `boardTieRole`, BoardTable's bracket CSS, `getScoreColor` and canonical avatar candidates. Hero unchanged.
- One `sr_leaderboards` request for all section IDs, one optional round-one tee-times request for upcoming IDs, cached `useTourPlayerFollows`.
- World Rankings negative movement uses `var(--tour-board-dim)` (rgba(248,250,252,.42)); positive movement retains TREND_UP. Updated ownership comment. No existing assertions changed.

## Stop: exact errors
1. Automatic typecheck:
```text
src/test/alsoWeekRebuild.test.tsx(14,133): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'initImmediate' does not exist in type 'InitOptions<unknown>'.
```
This is the newly added i18next provider fixture. No correction applied after completed-edit stop.

2. Full-suite shard 1:
```text
FAIL src/test/islandsNav.test.tsx > IndexGlance > shows the move, sparkline and stats once data settles
AssertionError: expected 'Your handicap index12.4▾ 0.2 on 30 Oc…' to contain '▾ 0.2 this month'
Expected: "▾ 0.2 this month"
Received: "Your handicap index12.4▾ 0.2 on 30 Oct3 rounds agoNow12.2Low index73Last round+1vs parOpen your handicap"
src/test/islandsNav.test.tsx:190:32
```
Unrelated to changed Tour files: fixture `iso(2)` is now 30 October, whereas today is 1 November. Its assertion assumes those two dates share a calendar month. This test/component was not modified. It was passing at the previous 5,004 baseline; a pre-existing failure at that run is not claimed.

## Tests and counts
- `bunx vitest run src/test/alsoWeekRebuild.test.tsx src/test/alsoWeekReads.test.ts src/test/tourOverviewDesignA.test.ts src/test/tourOverviewMovementColumn.test.ts`: 100/100, four files.
- `bunx vitest run --shard=1/2`: 2,447 passed + 1 failed = 2,448 executed; 251 passed + 1 failed file.
- `bunx vitest run --shard=2/2`: 2,591/2,591; 252 files.
- Full total: **5,038 passed / 1 failed / 5,039 executed across 504 files**.
- Baseline **5,004/502**; delta **+35 tests/+2 files**, solely `alsoWeekRebuild.test.tsx` (+32) and `alsoWeekReads.test.ts` (+3).
- No test deleted, renamed or rewritten. No old/new assertions to quote.

## Data authority and caveats
- Hero totalRounds comes from `deriveHeroState` → `roundsFromSchedule`: inclusive start/end calendar days, fallback four. This section only accepts valid 2–4-day schedules; unknown schedules omit OF total and holes-left figures instead of printing the hero fallback as fact. No new provider call.
- Refresh 60 seconds follows the shared tournaments-cache cadence. Hero carousel itself has focus refresh but no interval; cache polling does not automatically invalidate its static ready key. No unrelated hero change was made.
- Pre-round field comes from deduplicated players in the published round-one draw, not formatted hero tee groups or invented counts. Absent draw omits FIELD and followed-player line.
- Playoff winner uses hero winner sr_id matching a tied-score board entry, the established tournament-contest inference; no new winner view read.
- System font retained instead of frozen-out mock Geist. Canonical hairline avatar ring retained; stack's canvas wrappers are facepile separation.

## Phone proof
- Real guest Tour opened at `http://localhost:8080/tourhub`, 390×844; no page errors. Screenshot `/tmp/browser/also-week/section.png` visibly shows Simmons Bank Championship (live, before final round) and Maybank Championship (finished). Leaderboard rows, chase and final winner block render.
- `/tmp/browser/also-week/mock.png` and `/tmp/browser/also-week/comparison.png` capture the reference and side-by-side comparison.
- Current eligible section has **one live and one finished** event; two live events and a starting-this-week event cannot be shown without changing the frozen selection. Member followed rows have unit coverage only.
- Event tap navigation has not yet been exercised end-to-end; more mock state/coverage verification remains outstanding.

## Final status
- Approved correction of the three assertions and targeted/full-suite shards complete; all pass, as recorded above.
- Locale keys and additional state/heading/navigation coverage are now added. AGENTS.md pointer skipped by ruling.
- No SQL, migrations, RPC/edge/provider/native/Median/feed_config changes; round_pool_cap remains 30.
## Close-out
- Shard 4's 4 failures were src/test/reviewReceiptNextCourse.test.tsx (Review another build), repaired test-only under authorisation; all 4 now pass.
- Final shards: 2,011 / 1,876 / 2,001 / 1,907 = 7,795, zero failures.
- 320/390/430px screen checks (finished/live/upcoming cards, hero board) not completed in this session — remain for device check.
