# G2A course tabs — STOP report

## Saved implementation
- Standalone `/courses/:courseId` tab row remains in flow beneath its unchanged hero. Removed its sticky class, `data-stuck`, zero-height sticky sentinel and StickySafeAreaScrim.
- Existing IslandDock wraps an always-mounted docked copy; same activeTab and handleTabChange supply both copies. Existing URL parameter preservation, tab analytics, visited content and rating invalidation remain unchanged.
- CourseDetailShellTabs has opt-in `docked` appearance and structural copy markers; in-flow gutter/spacing unchanged, dock gutter/glass/motion/visibility owned by existing IslandDock.
- Modal branch still uses its original sticky CourseTabs and safe-area padding; no dock added there.
- HB4 heading observation/back island, hero and sections untouched. IslandDock and its CSS untouched; no global token changes.
- Mock's unrelated illustrative nav, photos, typography and decorative content were not adopted. Existing tab geometry remains canonical; this brief changes docking, not the tabs' in-place geometry.

## Stop: exact completed-check errors
Command:
`bunx vitest run src/test/g2aCourseTabs.test.tsx src/test/hb3CoursesDock.test.tsx src/test/hb4CourseBackName.test.tsx --maxWorkers=2`

**20 passed / 1 failed / 21 executed across 3 files**:
- g2aCourseTabs: 4 passed / 1 failed / 5 executed.
- hb3CoursesDock: 6/6 passed, unchanged.
- hb4CourseBackName: 10/10 passed, unchanged.

Full output retained at `/tmp/g2a/focused.log`. No unhandled-error section appeared.

```text
FAIL src/test/g2aCourseTabs.test.tsx > G2A course page dock > retains the modal sticky row and no dock or URL tab writes
AssertionError: expected '' to be 'env(safe-area-inset-top, 0px)' // Object.is equality
❯ src/test/g2aCourseTabs.test.tsx:104:34
104| expect(row.style.paddingTop).toBe('env(safe-area-inset-top, 0px)');
```

The untouched modal's CSS `env()` value is not retained by this test environment's parsed style. No assertion was loosened, product change made, or rerun attempted after the failure. The subsequent URL/analytics assertions in this modal case were not reached; do not call the whole modal case verified.

Automatic completed-edit typecheck also reported:
```text
=== build 2026-11-03T18:48:02Z ===
--- typecheck ---
src/test/g2aCourseTabs.test.tsx(48,23): error TS2352: Conversion of type '{ target: HTMLElement; isIntersecting: boolean; boundingClientRect: { bottom: number; }; rootBounds: { top: number; }; }' to type 'IntersectionObserverEntry' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
Type '{ target: HTMLElement; isIntersecting: boolean; boundingClientRect: { bottom: number; }; rootBounds: { top: number; }; }' is missing the following properties from type 'IntersectionObserverEntry': intersectionRatio, intersectionRect, time
```

This error was in the new test observer fixture, not product code. The subsequent explicit preview-error request authorized its correction only: at line48, `as IntersectionObserverEntry` became `as unknown as IntersectionObserverEntry`, following the compiler's instruction. Fixture data and every assertion stayed identical; no test rewritten/deleted/renamed and no count change (candidate6,406/569 remains unchanged). No tests rerun because the independent modal assertion stop remains.

Latest automatic verification:
```text
=== build 2026-11-03T18:49:17Z ===
build OK
```
The preview type error is cleared. **G2A completion remains blocked by the modal test failure**, pending authorized correction; no manual typecheck/build run.

## Counts and test-change inventory
- Last full green: **6,298 tests / 564 files**, NAV_SQ1.
- HB6 added28 in hb6Group1: candidate6,326/565, not full green.
- Tournament rebuild added59 tournamentV3Rules +13 tournamentV3Sections +3 tournamentV3Page: candidate**6,401/568**, last reported baseline; shard1 failed.
- G2A adds **5 tests / 1 file**, candidate**6,406/569**; not a full-suite passing result.

All five new cases in `src/test/g2aCourseTabs.test.tsx`:
1. “keeps standalone tabs in flow with no stuck marker or sticky scrim”
2. “shows only after the row passes the islands, while open”
3. “keeps the hidden copy mounted inert and aria-hidden across folding”
4. “docked and in-place selections share URL state and analytics without dropping other parameters”
5. “retains the modal sticky row and no dock or URL tab writes” — failed as quoted above.

Real QueryClientProvider and MemoryRouter wrap GolfClubView. Only data hooks/tab contents/sheets are isolated; shared IslandDock, tab rows, actual GolfClubView state/URL handler and scroll store run in tests. Complete required react-i18next mock used; assertions address structure, not translated words.

**Existing tests changed/deleted/renamed/rewritten: none.** No existing assertion diff to quote. Both product files' precise changes are summarized above; no shared component altered for mock compatibility.

All four full-suite shards were **not run**, due to the new focused failure. No full passing count or zero-failure claim; automatic build is now clean after the fixture-only type correction.

## Pre-existing failures, untouched
- `headerB1.test.tsx:97:39`, “GI1 non-condense guest capsule remains byte-identical through nav changes”: expected23px, received16px for `/discover`, confirmed HB6 failure.
- `roundNotificationOverlay.test.ts:11:68`, “gives a cold round address back chrome with the page fallback and no HCP cell”: exact expected object lacks HB6 `condense:true` and `scrim:'soft'`; observed in prior tournament shard1.
- Three `tourPlayoffShortenedEvents.test.tsx` “tournament page situation block” cases: awaiting-playoff pulse live, awaiting-playoff pulse completed, normal finished four-round event; `Error: No QueryClient set, use QueryClientProvider to set one`, through `useTournamentPick.ts:37:10`/`TournamentPage.tsx:85:20`, observed prior tournament shard1.
- `tourOverviewBand.test.tsx:65–66` `/discover` non-condense fixture was previously suspected only, not a confirmed failing run. Do not count it as a proven failure.

No pre-existing failing test was edited or rerun in this task.

## Browser and other limitations
No browser run/screenshots after the new check failure. Requested real dock screenshot with `--sat47px`, top109px, computed glass, selected edge and motion remain **unverified**. Reuse of canonical IslandDock CSS is source evidence only, not visual proof.
External unmanaged sign-in remains unavailable; no credentials/bypass/auth changes attempted.
Referenced memory files `mem://features/chrome/hb4-course-details.md` and `mem://features/chrome/island-dock-paint.md` could not be read (tool said they do not exist, including extensionless retries); supplied memory index requirements and existing component patterns were preserved.

## Every touched file
- `src/features/courses/components/CourseDetailShellTabs.tsx`: docked opt-in/copy marker and local ownership comment.
- `src/components/golf-club/GolfClubView.tsx`: standalone dock composition, removed obsolete standalone sticky imports/state/markup; modal untouched.
- New `src/test/g2aCourseTabs.test.tsx`: five cases.
- `roadmap.md`: G2A scope and stopped state only.
- New `G2A_COURSE_TABS_REPORT.md`: this report.

No SQL/migrations/migration files/deployed RPC/edge/feed_config/native/Median edits; round_pool_cap remains30. No guest-browsing/review-wizard/news/round-plot logic edited; existing course page presentation change is the authorized scope. No publication.