# Briefs 48–48C — first implementation, not closed

## 1. Files changed

- `roadmap.md`
- `src/features/tourhub/components/overview-v3/ComingUpSlot.tsx`
- `src/features/tourhub/components/overview-v3/HybridHero.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- `src/features/tourhub/components/overview-v3/HybridOverviewShell.tsx`
- `src/features/tourhub/components/overview-v3/HybridPhotoFrame.tsx`
- `src/features/tourhub/components/overview-v3/LiveOverviewSections.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridComingUp.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridPhoto.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridPicks.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridRecap.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridSections.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridUpcoming.tsx`
- `src/features/tourhub/components/overview-v3/OverviewTourSwitcher.tsx`
- `src/features/tourhub/components/overview-v3/hybridOverviewRules.ts`
- `src/features/tourhub/components/overview-v3/overviewShells.tsx`
- `src/features/tourhub/components/overview-v3/upcomingOverviewRules.ts`
- `src/features/tourhub/components/overview-v3/useUpcomingOverview.ts`
- `src/features/tourhub/components/tabs/OverviewPageV3.tsx`
- `src/features/tourhub/overview/sections/AlsoThisWeek.tsx`
- `src/features/tourhub/overview/sections/AlsoWeekHybridCard.tsx`
- `src/features/tourhub/skins/SkinsSections.tsx`
- `src/locales/en/tourhub.json`
- `src/styles/tour-overview-hybrid.css`
- `src/test/tourOverviewHybrid48.test.tsx`

Overview-only adapters now provide the photo/glass presentation, five-tour switcher, stage-specific tiles, ten-row board, movers, heat course, pick rail, upcoming and recap lists, Also this week, Coming up and loading geometry. StoryBand moves after Coming up. Shared PhotoBand, HeroBoardRows, MiniBoard, WonChart, UpcomingFacts, UpcomingLastYear and UpcomingCourse defaults remain unchanged. SkinsTable has an opt-in overview grid; its default is preserved. No tournament page file was changed. The tournament-page regression has not yet been run, so unchanged rendering is not claimed as verified.

## 2. Rewritten tests

None. No existing test was deleted, renamed or rewritten. The authorized obsolete overview assertions still need updating and reporting. Original copies of five affected test files were retained under `/tmp/brief48-before` during this turn; temporary files are not durable deliverables.

New file: `src/test/tourOverviewHybrid48.test.tsx`, 37 tests covering tile selection/counts, projected/actual cut authority, round columns, ten-row admission, scorecard opening, country deduplication, final low round/playoff/date rules, upcoming priority, champion/tie/skins identities, pick statuses, recap row limits and switcher dispatch.

## 3. Test results and accounting

Baseline: **10,804 tests / 955 files**, zero failures, from the last reported four-shard result at `6b450d8dc8`.

Executed:

```text
npx vitest run --maxWorkers=2 src/test/tourOverviewHybrid48.test.tsx src/test/buttonBaseClassGuard.test.ts src/test/fixOverflowSource.test.ts
```

Result: **48 passed / 3 files**, zero failures: new overview tests 37, unchanged Button safeguard 2, unchanged overflow safeguard 9. Log: `.lovable/reports/brief48-48c/focused.log`.

The full suite has NOT been run after these edits. The declared addition is +37 tests / +1 file, solely `tourOverviewHybrid48.test.tsx`; the projected suite scope is 10,841 / 956, NOT a verified full-suite result. No pre-existing failures are carried from the baseline and no test failure occurred in the focused run.

Pending commands, sequentially:

```text
npx vitest run --maxWorkers=2 --shard=1/4
npx vitest run --maxWorkers=2 --shard=2/4
npx vitest run --maxWorkers=2 --shard=3/4
npx vitest run --maxWorkers=2 --shard=4/4
```

Latest harness compilation signal: `build OK`, 2026-11-28T07:25:04Z. Intermediate edit-state type/syntax errors were resolved before the focused run; no surviving completed-edit error is reported. No manual build/typecheck was run.

## 4. Captures and visual acceptance

`lovable auth-session --json --self` refused with:

```text
 gateway error (failed_precondition): this project's Supabase backend is user-managed; Lovable does not sign its tokens, so no session can be minted for it
```

No credentials were requested, guest browsing changed, or authentication bypass added.

Browser checks opened `http://localhost:8080/tourhub` at 390×1800 and 320×1800. The route remained `/tourhub`; after the initial observation both widths showed the overview loading shell and zero `[data-overview-photo-band]` elements. These are loading observations, not the requested live/event screenshots and not proof that the route can never settle. No specific live event was verified. Live/completed/upcoming/recap and skins/team fixture captures remain pending; exact-match and overflow acceptance are NOT claimed.

## 5. Open prerequisite and remaining work

Upcoming cup glass-card names are unavailable on the current upcoming path:

- `useUpcomingOverview.ts` supplies individual field/draw players, not the cup teams.
- `useOverviewChampion.tsx:52` disables its leaderboard read in the upcoming state.

The card is omitted rather than filled with invented team names. The open question asks permission for an upcoming-cup-only existing leaderboard read. Other adapters were implemented without waiting for that answer.

Still unfinished: authorized old-layout test rewrites; four sequential shards and full-suite reconciliation; all requested captures and visual acceptance; complete final report. These briefs are not closed.

## 6. Brief corrections and constraints

- Ben ruled below 360px: title 26px, glass name 14px, figure 28px across Briefs 48–48C; live course hardest/easiest gap 10px; other narrow-screen values unchanged.
- Ben ruled every requested/mock weight 800 becomes 700, including glass figures, tiles, board totals, mover places and cup points. Sizes, colours and tracking otherwise remain as specified. Newly defined overview CSS uses 700 for these roles; no existing 800 declaration was changed.
- Recap facts use the named Events/Winners/Most wins trio by calling the existing recapFactCells with card/youngest figures excluded. Recap data/freshness/selection remain unchanged.
- Recap standings flags are conditional on a country already present in a row. No country was invented or additional recap data read added.
- Existing authoring primitives append their own arrow, so overview actions remove a supplied trailing arrow before rendering to prevent duplicates.

No SQL, migrations or migration files; no deployed RPC/edge edits; feed_config untouched; round_pool_cap unchanged at 30; no native/Median configuration edits; no security Fix all. Guest browsing, review wizard, news composition and round plots were not edited; only the explicitly requested StoryBand placement moved.
