# Integrated Our picks — STOP

## Delivered scope
Shared PicksBlock now has page-background presentation with retained built hairline, heading padding16px20px10px and grid padding0px20px. YourPickCard encloses question, explanation, row and circle footer; record remains the last plain clickable line with no divider, bar or Us/You figures. Pick uses filled amber34px action; Change uses outlined30px pill. Existing picker/record sheets remain unchanged, including prior deselection, lowercase from and MC fixes.

Circle rank uses existing `get_tournament_circle_rank(p_tournament_id)` RPC, signed-in/non-anonymous only and viewer-keyed. Matching leaderboard cache success events refetch it while live; no independent timer or client follow/privacy calculation. Error data is suppressed. New section-only rules preserve old sheet comparison helpers.

User resolved pre-lock number-word/mock conflict in favour of **digits: 6 of your circle**. Other heading/ahead word forms follow the brief. Corrected upload is a reference only, not an embedded app asset.

## Required stop
Command:
`bunx vitest run src/test/integratedPicks.test.tsx src/test/tournamentPickInsights.test.tsx src/test/yourPickSheet.test.tsx src/test/tourOverviewPicksTeeLine.test.tsx src/test/tournamentV3Page.test.tsx --maxWorkers=2`

**126 passed /1 failed /127 tests; 4 files passed /1 failed; exit1.** No unhandled-error summary in this focused output. Full original output: `/tmp/our-picks/focused.log` (temporary sandbox storage).

```text
FAIL src/test/integratedPicks.test.tsx > integrated card states > no pick combines question, exact lock copy, digit circle count and action
AssertionError: expected 'DG6 of your circle have picked. Most …' to be '6 of your circle have picked. Most pi…' // Object.is equality
Expected: "6 of your circle have picked. Most picked: Ghim."
Received: "DG6 of your circle have picked. Most picked: Ghim."
 ❯ src/test/integratedPicks.test.tsx:36:542
```

DG is the real avatar's fallback initials included by the test's whole-footer textContent selector. No assertion or product correction after failure; stopped as required. Four full-suite shards not run. Build clean at **2026-11-03T22:25:29Z build OK**.

Pre-existing stop: CM1 focused148 passed but unhandled `TypeError: scroller?.scrollTo is not a function`, `src/lib/getScrollParent.ts:101:13`, from WatchFeed.tsx:449:13 in ws1WatchTop. It was not exercised/reproduced in this picks focused run and remains unauthorised to fix. No other pre-existing failures reproduced.

## Data/scope limitation
Guest pick-state read is disabled by existing authority. No existing guest-accessible read supplies `locks_at`; pick field exposes players only. Guest question/action render with a no-time explanation rather than inventing first-tee time. Exact timed guest copy is therefore blocked pending a real guest-accessible source; no read permission, SQL, RPC or guest-browsing rule changed. Missing signed-in lock time also uses truthful no-time copy. No exact full mock-parity claim: shared avatars retain canonical1/1.05 proportions rather than overriding internals to mock's square. Ring hugs the real36px avatar at34% radius; local inner colour matches signed-off ring.

Live not-started row keeps existing tee/no-figure behaviour. Old live row comparison (“Behind Ghim.”) and status sublines remain as built; new explanatory sentence above carries full specified comparison/status wording. Completed row contains percentile only; heading owns ours comparison. Rank unavailable suppresses circle conclusions rather than inferring from the face stack.

## Files touched
- `src/features/tourhub/hooks/useTournamentCircleRank.ts` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/integratedPickRules.ts` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PickMemberBands.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css`
- `src/index.css` (section-local semantic tokens only)
- `public/locales/en/tourhub.json`
- `public/locales/en-XA/tourhub.json`
- `src/test/tournamentPickInsights.test.tsx`
- `src/test/integratedPicks.test.tsx` (new)
- `AGENTS.md`, `roadmap.md`, `INTEGRATED_OUR_PICKS_REPORT.md`
- Memory `mem://features/tourhub/integrated-picks` (new), `mem://index.md`.

No product files deleted; no existing tests deleted. No TournamentPage/OverviewHero edits required: both already consume shared HeroBoardSection/PicksBlock. Actual new circle hook is independent of existing partial pick-module mocks.

## Test reconciliation and authorised rewrites
Last completed full baseline **6,472 /576 files** (FIX_GRID_1). Intervening CM1 candidate **6,486 /576**, +17 new CM1/+2 ER1/−1 HB6/−4 deleted Media tests; its full suite was not run. This work adds **23 tests /1 file**, candidate **6,509 /577**, not verified full-suite execution/pass totals. Existing tournamentPickInsights remains56 tests; new integratedPicks has23 (22 passed/1 failed). Other focused files:56/28/17/3 passed.

Two rewritten cases in `tournamentPickInsights.test.tsx` (both expressly authorised by moved section behaviour):

1. “finished card combines real percentile with best-pick comparison” → “finished card separates real percentile from the best-pick heading”. Comparison moved into heading:
```diff
- expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Beat 95% of the field. Level with our best.');
+ expect(document.querySelector('.pick-mine-sub')?.textContent).toBe('Beat 95% of the field.');
+ expect(document.querySelector('[data-pick-question]')?.textContent).toBe('You matched our best pick');
```
2. Retained “followed singular and record row use server counts; zero hides both”: section voice changes, existing record assertions unchanged:
```diff
- await waitFor(()=>expect(document.querySelector('[data-followed-picks]')?.textContent).toContain('1 person you follow has picked.'));
+ await waitFor(()=>expect(document.querySelector('[data-followed-picks]')?.textContent).toContain('1 of your circle has picked.'));
```
Full original test saved at `/tmp/our-picks/before-tournamentPickInsights.test.tsx`.

New tests named by template: ahead/level heading5 cases; nobody-picked/absent rank1; live best comparison3; model/status precedence1; final best comparison3; final circle results4; no-pick1; picked1; live/completed footer1; RPC/board refresh1; signed-out1; anonymous1. No styling snapshots introduced.

## Remaining checks
Four shards, additional geometry/zero-record integration coverage, authenticated real-input end-to-end and visual mock comparison remain unverified after stop. No manual builds/typechecks, SQL, migrations, RPC deployments, edge functions, native/Median, feed_config or round_pool_cap changes. CM1 files/tests were not changed in this work.