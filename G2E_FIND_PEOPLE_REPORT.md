# G2E Find people — implemented; full suite stopped

## Files touched
- `src/features/chrome-v2/registry.ts`: /find-people gets dark/bleeding/soft-scrim/condensing islands and global history back with /clubhouse fallback. Legacy redirect rule unchanged.
- `src/pages/FindPeoplePage.tsx`: removed local header/back; unchanged PageTitle on actual observed h1; island clearance; original search stays in flow. Shared tab renderer feeds original and docked copies through unchanged onTab URL setter. Content, Follow all, See all, invite footer and useHideBottomNav preserved. Header documents ownership locally; no new architecture module.
- `src/test/g2eFindPeopleHeader.test.tsx`: seven new cases using real router/query provider and real BottomNavigationProvider/hide hook; canonical complete i18n mock and controlled empty read hooks.
- `roadmap.md`, `G2E_FIND_PEOPLE_REPORT.md`: results/counts/blockers.

No existing tests deleted, renamed or rewritten; no old-header case needed modification (existing three-tab assertion sees only accessible in-flow tabs while dock is inert). No SQL/migrations, RPC/edge deployment, feed_config, native/Median, guest browsing, wizard, news or plot changes. round_pool_cap remains30. PageTitle and IslandDock unchanged.

## Test accounting
Before: prior G2D candidate **6433 tests / 572 files**, not a green full-suite total. After: candidate **6440 / 573** (+7/+1), entirely new `g2eFindPeopleHeader.test.tsx`:
1. registers dark soft condensing back islands with /clubhouse fallback
2. uses the title h1 instead of the old local header/back
3. shows the actual title name only past its h1 while expanded
4. docks tabs only past their row with islands expanded
5. sets/removes tab in both copies preserving unrelated parameters
6. keeps one unchanged search input outside the dock
7. hides real bottom-navigation state on mount and restores it on leave

`bunx vitest run src/test/g2eFindPeopleHeader.test.tsx src/test/wf1FindPeople.test.tsx src/test/activeRing.test.tsx --maxWorkers=2`: **61/61**, 3/3 files (7+27+27), no unhandled errors. Full output `/tmp/g2e/focused.log`. Existing search-result structure logs `Warning: validateDOMNesting(...): <button> cannot appear as a descendant of <button>.` through FollowPill/SearchResults in the unchanged page content; not a failing test, not corrected.

`bunx vitest run --shard=1/4 --maxWorkers=2`: **1634 passed / 4 failed / 1638 executed**, 142 passed / 2 failed / 144 files, no unhandled-errors report. Full output `/tmp/g2e/shard1.log` retained. Stopped; no shards2–4, no failing-test corrections. Shard assignments changed: its +14 executed versus G2D is not the full-suite delta; only seven new cases were added globally.

## Inherited failures (same G2B/G2C/G2D blockers)
- `src/test/roundNotificationOverlay.test.ts:11:68`, “gives a cold round address back chrome with the page fallback and no HCP cell”: `AssertionError: expected { chrome: 'island', …(6) } to deeply equal { chrome: 'island', …(4) }`; Received includes `condense: true`, `scrim: 'soft'` absent from old expectation.
- `src/test/tourPlayoffShortenedEvents.test.tsx`: “shows the situation block for an awaiting-playoff event (pulse live) and not "Final"”, same `(pulse completed)`, “renders no block for a normal finished four-round event”: `Error: No QueryClient set, use QueryClientProvider to set one`; stack `src/features/tourhub/hooks/useTournamentPick.ts:37:10` → `TournamentPage.tsx:89:20`. Runner supplies no test line.
- Prior known failures not rerun: `headerB1.test.tsx:97:39` expected23px/received16px; `g2aCourseTabs.test.tsx:104:34` expected `env(safe-area-inset-top, 0px)`/received empty string. Suspected tourOverviewBand stale fixture is not a confirmed failure. Existing siLadder/SiLadder mismatch untouched.

## Browser/build and limits
Real Chromium 390×844 fixture at localhost `/g2e-fixture`, actual FindPeoplePage/PageTitle/IslandDock/IslandBackCapsule, real nav provider/router/query provider and #root scroller; controlled empty suggestions/session/search/activity. H1 y109, 30px/700; down500/up450 shows full back name and dock y109/h34. Clicking dock Golfers updates in-place selected tab. Search remains only in original page. No page errors. Reviewed `/tmp/browser/g2e/title.png`, `/tmp/browser/g2e/docked.png`; fixture includes original invite footer but omits right island/global nav and real data/authenticated live route. No full-mock parity or authenticated end-to-end claim.

Frozen original search/chip/content styling remains build-authoritative even where mock differs; shared PageTitle retains G2C tracking0 under higher-priority design instructions. Mock bottom nav is not adopted because the brief explicitly preserves hidden navigation.

Latest automatic preview entry: **build OK 2026-11-03T19:15:13Z**. No manual build/typecheck. All-four-shard/zero-failure acceptance remains blocked by the inherited failures above.