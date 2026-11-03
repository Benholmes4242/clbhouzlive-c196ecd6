# HB6 group1 — STOP report

## Status
Stopped after one completed-edit focused failure. No correction, rerun, full shards or browser captures followed the failure. No pre-existing failing test was observed against the latest green baseline6,298/564. Full failing output retained`/tmp/hb6/focused.log`.

```text
FAIL src/test/headerB1.test.tsx > HEADER_B1 shared state and controls > GI1 non-condense guest capsule remains byte-identical through nav changes
AssertionError: expected '16px' to be '23px' // Object.is equality
Expected: "23px"
Received: "16px"
❯ src/test/headerB1.test.tsx:97:39
95| mocks.guest = true; mount('/discover');
97| expect(guest?.style.borderRadius).toBe('23px');
```
The test's `/discover` example is no longer non-condense under HB6. Its assertions were left unchanged. Also identified (not executed in this focused run):`tourOverviewBand.test.tsx:65–66` uses`/discover` as its non-header-B example; likely stale for the same reason. The brief permits moving examples to non-header-B routes, but its explicit ANY NEW FAILURE stop is honored; neither correction was applied after the failing run.

## Implemented before STOP
- Existing registered island entries opt into scrim:soft/condense:true and lose scrollAway through one registry-local pass; none entries/unmatched default remain untouched.
- Business profiles become history-back with`/` fallback.
- Static-title optional prop in IslandBackCapsule supports Next round open without heading/folded hidden; observed-name behavior unchanged when prop absent.
- BusinessProfilePage owns full business-name observation and passes optional heading ref into both shared ClubProfileHero branches. Hero visual/content/actions unchanged.
- MediaLibraryPage owns Media observation through optional LibraryHead heading ref.
- News page files untouched under the user's explicit ruling. Registry news entries opt in; no story-headline observation was added. Existing page-owned news chrome/suppression may prevent the registry header appearing; real story proof not claimed.

## Inventory / missing source realities
|Routes/family|Left after registry update|Name source/status|
|---|---|---|
|Business profiles|Back + observed name|BusinessProfilePage→ClubProfileHero actual h1, full business.name|
|Business/person followers/following|Back|Actual SocialListPage big identity text is owner name, not Followers/Following list title. Anchor not added; requires title-source ruling without content changes|
|Profile quest/subpages|Back|Quest/index/replay redirect to profile handicap tab; no own heading; no invented page|
|Handicap exact|Back + static Next round|Registry title, anchor-free; actual route redirects to profile|
|Handicap prefixes/rivalry|Back|Mounted legacy routes redirect to profile/compare; no own heading|
|Tour News index|Logo default|Page files frozen; existing page slot not changed|
|Tour News stories|Back|Story anchor omitted per user ruling|
|Tourhub/tour backstops|Back|Registry backstops have no actual corresponding page demonstrated; no heading invented|
|Media|Back + observed name|LibraryHead actual h1 Media|
|Friends activity|Back|Redirect to courses, no own heading|
|Discover News|Logo|Page files frozen|
|Discover stories|Back|Story anchor omitted per user ruling|
|Discover themes/video query main=videos&section|Back|Registry-only legacy destinations; no mounted page demonstrated|
|Round|Back|Actual RoundPage mounts canonical sheet or sign-in shell and synthesizes Activity background; no own big heading to observe. Player/course inside sheet not copied into page chrome|
|Discover prefix|Logo|No name required|

Round, redirect-only and registry-only sources have not been modified or fabricated. This inventory names remaining work rather than claiming all requested anchors are finished.

## Tests / counts
Focused command:
`bunx vitest run src/test/hb6Group1.test.tsx src/test/hb5ProfileBackName.test.tsx src/test/hb4CourseBackName.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx --maxWorkers=2`
71 passed/1 failed/72 executed across5 files;0 Vitest unhandled errors. Existing act/Browserslist warnings present. New hb6Group1 file28/28 passed.

Before6,298/564; candidate inventory6,326/565 (+28/+1 solely hb6Group1), NOT a full-suite passing result. No tests deleted. Existing hb5 file stays13; five authorized parameterized cases rewritten, zero delta:
- Four cases `keeps %s out of soft folding chrome`→`HB6 opts %s into soft folding chrome` for profile followers/following/quest/edit. `expect(spec.condense).toBeUndefined()`→`toBe(true)` and`expect(spec.scrim).toBeUndefined()`→`toBe('soft')`; back assertion unchanged. Reason: HB6 deliberately opts these routes in.
- `preserves business profile logo and nonfolding chrome`→`HB6 business profile uses soft folding history back with home fallback`. Undefined condense/scrim assertions become true/soft;`expect(spec.left).toBeUndefined()` becomes exact history-back,title:null,fallback:'/'. Reason: HB6 deliberately replaces business logo with back.

New28 case inventory:23 parameterized listed routes (each asserts soft/dark/fixed/squircle and correct logo/back);1 full registry/none audit;2 actual business/media heading show-and-cleanup cases;1 static-title fold case;1 cold business-back fallback case. Named tests are in`src/test/hb6Group1.test.tsx`. No headerB1/islandSquircle assertion changed in this task.

## Build
Latest automatic`=== build 2026-11-03T17:46:59Z ===` / `build OK`. No manual build/typecheck per environment rules.

## Every touched file
- Product:`src/features/chrome-v2/registry.ts`, `src/features/chrome-v2/IslandBackCapsule.tsx`, `src/features/chrome-v2/ChromeIsland.tsx`, `src/pages/BusinessProfilePage.tsx`, `src/components/business/hero/ClubProfileHero.tsx`, `src/features/media-library/MediaLibraryPage.tsx`, `src/features/media-library/LibraryChrome.tsx`.
- Tests:`src/test/hb5ProfileBackName.test.tsx`, new`src/test/hb6Group1.test.tsx`.
- Documentation:new`HB6_GROUP1_REPORT.md`, `roadmap.md`.
- Memory:new`mem://features/chrome/hb6-group1.md`, `mem://index.md`.

No news page, guest browsing, review wizard, bottom nav, round plots, SQL/migrations,deployed functions/RPCs,feed_config or native/Median edits. round_pool_cap stays30. Shared geometry/observer/nav behavior retains existing default behavior except opt-in static title.