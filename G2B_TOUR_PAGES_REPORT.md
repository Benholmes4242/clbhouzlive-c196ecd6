# G2B Tour pages — STOP report

## Saved changes
- Only tournament and player detail roots (including optional trailing slash) resolve to dark, bleeding, soft-fade, condensed island chrome; history back fallbacks remain `/tourhub?tab=schedule` and `/tourhub?tab=players`. Deeper paths keep existing none rules.
- TourPageShell accepts `headerB=false`. Opt-in renders neither AppHeader nor the legacy suppression child; defaults retain both. The suppression hook remains in a legacy-only child, avoiding conditional hooks or any suppression call on headerB pages. Shared children/belowTitle/scroll control unchanged.
- TournamentPage and PlayerPage alone pass headerB. Existing tournament hero starts without the old AppHeader above it. Player canvas uses padding-top `var(--island-clearance)`; existing identity block spacing/content remains.
- Actual full-name headings feed useIslandBackName, no pre-clipping. Loading/error gates pass null; observer cleanup remains owned by the canonical hook. Shared 16-to-13px fit and squircle/glass/fold engine untouched.
- **Stale source name in brief:** tournament rebuild already replaced old HeroSection with TournamentHero in TournamentV3Sections.tsx. Ref attached to its actual `<h1 className="tv-title">{meta.name}</h1>`, not the unmounted old hero; no rebuild reversal. Player ref attaches to existing `.pv-name` h1. Optional refs preserve standalone hero consumers.
- Mock's illustrative 500px tournament photo, centered player arrangement and older nav differ from frozen current content; retained current 340px photo and existing player layout. G2B changes chrome/clearance, not those elements.

## Verification
Focused command:
`bunx vitest run src/test/g2bTourHeaders.test.tsx src/test/tourHubN2Shell.test.ts src/test/playerRebuildPage.test.tsx src/test/tournamentV3Page.test.tsx --maxWorkers=2`

**31/31 tests passed / 4 files**: new g2bTourHeaders11, existing tourHubN2Shell3, playerRebuildPage14, tournamentV3Page3. Full output `/tmp/g2b/focused.log`.

New 11 cases comprise: two route specs; two opt-in no-AppHeader/no-suppression; two default shell ownership/cleanup for schedule/leaderboard; two actual hero h1 observation/open-fold/name clearing; two null-name arrow-only cases; one deeper-path exclusion. Name/error tests compose real heroes with canonical hook/capsule and real scroll store, not full loading/error data flows. Existing page-content regressions remained unchanged.

Full command: `bunx vitest run --shard=1/4 --maxWorkers=2`
**1,620 passed / 4 failed / 1,624 executed**, 143 files (141 passing / 2 failing). No unhandled-error section reported. Full output retained `/tmp/g2b/shard1.log` (231,358 bytes). All four failures were previously confirmed before G2B. No correction, rerun or shards2–4 after failure.

```text
FAIL src/test/roundNotificationOverlay.test.ts > round notifications open the scorecard over Activity > gives a cold round address back chrome with the page fallback and no HCP cell
AssertionError: expected { chrome: 'island', …(6) } to deeply equal { chrome: 'island', …(4) }
Expected object omits received "condense": true and "scrim": "soft".
❯ src/test/roundNotificationOverlay.test.ts:11:68

FAIL src/test/tourPlayoffShortenedEvents.test.tsx > tournament page situation block > shows the situation block for an awaiting-playoff event (pulse live) and not "Final"
FAIL src/test/tourPlayoffShortenedEvents.test.tsx > tournament page situation block > shows the situation block for an awaiting-playoff event (pulse completed) and not "Final"
FAIL src/test/tourPlayoffShortenedEvents.test.tsx > tournament page situation block > renders no block for a normal finished four-round event
Error: No QueryClient set, use QueryClientProvider to set one
❯ useQueryClient node_modules/@tanstack/react-query/src/QueryClientProvider.tsx:18:11
❯ Module.usePickField src/features/tourhub/hooks/useTournamentPick.ts:37:10
❯ TournamentPage src/features/tourhub/tournament-v2/TournamentPage.tsx:89:20
```

## Other prior failures, untouched
- HB6 `headerB1.test.tsx:97:39`, “GI1 non-condense guest capsule remains byte-identical through nav changes”: expected23px, received16px for `/discover`. Not run here.
- G2A `g2aCourseTabs.test.tsx:104:34`, “retains the modal sticky row and no dock or URL tab writes”: expected `env(safe-area-inset-top, 0px)`, received `''`. Not run here. Its TS2352 observer-fixture error was explicitly fixed in the prior turn; not a surviving error.
- `tourOverviewBand.test.tsx:65–66` stale `/discover` example is suspected only, not a confirmed failing run; not run here.

## Counts and authorized test changes
Last full green6,298/564 NAV_SQ1 → HB6 +28/+1 = candidate6,326/565 → tournament +75/+3 = candidate6,401/568 → G2A +5/+1 = last reported candidate**6,406/569** → G2B +11/+1 solely `g2bTourHeaders.test.tsx` = **6,417/570 candidate**, not full passing result. Existing tests deleted/renamed/rewritten: **none**; no old assertion diff to quote. No suite inventory changed by passing existing focused files.

## Browser limitation
Temporary fixture prepared under `/tmp/browser/g2b` with real heroes, TourPageShell, back capsule and observer, manual sat47/clearance109 and fabricated identities (signed-out data unavailable; external unmanaged sign-in). It did **not** include full global right-island composition and was not full live-page proof.
Bundle preparation failed before screenshots:
```text
src/components/courses/course-detail/about/AllHolesSheet.tsx:14:79:
ERROR: Cannot read file: /dev-server/src/features/courses/_shared/siLadderRules.tsx
Use "src/features/courses/_shared/SiLadder.tsx" instead ... to avoid issues with case-sensitive file systems
```
The subsequent fixture navigation timed out waiting for load because no bundle was produced. Full browser output `/tmp/g2b/browser.log`; stderr also retained in exec tool log. This is a pre-existing case-sensitive source dependency encountered by standalone bundling, not a failing G2B preview build; no out-of-scope course file altered. No valid screenshots or mock parity claim. Browser fixture recovery was not attempted after shard stop. Required top/named captures remain unverified.

## Build
Transient ref-prop error occurred between dependent file edits and was resolved before focused checks. Latest completed automatic result:
```text
=== build 2026-11-03T18:52:14Z ===
build OK
```
No manual project build/typecheck. Automatic preview clean does not mean the standalone browser bundle succeeded.

## Every touched file
- `src/features/chrome-v2/registry.ts`
- `src/features/tourhub/components/TourPageShell.tsx` (local ownership header updated)
- `src/features/tourhub/tournament-v2/TournamentPage.tsx`
- `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx` (actual hero ref only)
- `src/features/tourhub/player-v2/PlayerPage.tsx`
- `src/features/tourhub/player-v2/sections/HeroSection.tsx`
- New `src/test/g2bTourHeaders.test.tsx`
- `roadmap.md`
- New `G2B_TOUR_PAGES_REPORT.md`

No TourHubMainPage/LeaderboardTab edits, shared island engine/IslandDock edits, guest-browsing/review-wizard/news/round-plot changes, SQL/migrations/deployed RPC/edge/feed_config/native/Median changes. round_pool_cap remains30. No publication.

## Final status (STABILISE_1, 3 Nov 2026)
The test stops that were open in this brief were resolved with test-only changes. The diffs, the authority for each and the named cases are in `STABILISE_1_REPORT.md`. Full suite in four shards with --maxWorkers=2: 1,638 / 1,538 / 1,641 / 1,632 = **6,449 tests, 574 files, 0 failures, 0 unhandled errors**. This confirms the earlier estimate of 6,449. Browser evidence: signed-in checks unavailable (external sign-in); signed-out live checks and fixture coverage are listed in STABILISE_1_REPORT.md.
