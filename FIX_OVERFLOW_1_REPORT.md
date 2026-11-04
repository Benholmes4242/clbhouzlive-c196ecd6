# FIX_OVERFLOW_1 — partial implementation / scoped stop

## Continuation ruling — STOP at 10:00 UTC
The approved52 remaining grid objects in38 files now have only `gridTemplateColumns: 'minmax(0, 1fr)'` added. The three ruled wizard files are unchanged. Their named/commented exceptions are in the new app-wide guard, which passed. Full current path/line/object inventory: `docs/verification/fix-overflow-1/inline-grid-continuation.json`. This AST inventory also catches style constants (FullField rowStyle and YourCourseAnalyticsSheet CARD_LIST), which the earlier direct-inline-only audit missed; it still yields52 remaining objects. Tailwind remains unchanged.

ChromeIsland now subscribes live to `matchMedia('(max-width: 340px)')` and reuses existing right-island folded styles on every route. Left scroll-fold state is unchanged. No new design, guest content, actions or gate changes.

**STOP: focused command returned11 failures,39 passes across50 tests (2 failed files/3 passed files). No shards or new browser checks run after this failure. Full output preserved:** `docs/verification/fix-overflow-1/continuation/focused.log`.

- `src/test/overflowRightIsland.test.tsx:43:26`, five guest cases (paths `/tourhub`, `/`, `/amateur`, `/courses`, `/watch/top100`): `TestingLibraryElementError: Unable to find an element with the role "button" and name "Log in"`.
- `src/test/overflowRightIsland.test.tsx:49:27`, five member cases (same paths): `TestingLibraryElementError: Unable to find an element with the role "button" and name "Search"`.
- Existing `src/test/gi1GuestIslandReducedMotion.test.tsx:37:28`, `guest glass and Log in fold have no transitions at rest or folded`: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Log in"`.

The new tests incorrectly use accessible-name lookup for aria-hidden controls; the failure output shows those controls present with `aria-hidden="true"` and empty accessible names. The existing reduced-motion fixture returns matches=true for EVERY media query, so the new width query also matches and folds Log in before its existing accessible lookup. These are identified fixture/selector issues, not permission to silently repair them. No failure is classified as pre-existing: the existing test's failure is newly exposed by this continuation. No pre-existing failing tests are known.

Exact command: `bunx vitest run src/test/fixOverflowSource.test.ts src/test/overflowRightIsland.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/gi1GuestIslandReducedMotion.test.tsx --maxWorkers=2`.

**Inventory reconciliation:** last full executed suite6633/585; current expected inventory6648/586 (+15 tests/+1 file), NOT a full-suite passing claim. `fixOverflowSource.test.ts` adds1 case: `all non-test inline grids declare columns except the three wizard-owned files`; existing8 cases/assertions preserved (only imports/comment extended). New `overflowRightIsland.test.tsx` adds14 cases: five guest-at-rest paths, five member-at-rest paths, two above340 guest/member cases, two live-media guest/member cases. No tests deleted/renamed/rewritten; no existing assertions changed. HeaderB1 18/18, islandSquircle8/8 and containment source9/9 passed. Four new above-width/live-media cases passed; ten new hidden-control lookups failed. GI1 existing case failed.

Additional touched files: all38 files named in continuation JSON, ChromeIsland, fixOverflowSource.test.ts, new overflowRightIsland.test.tsx, AGENTS.md (guard ownership rule), roadmap.md, this report, continuation JSON and focused log. No prohibited-area logic edits; three wizard exemptions untouched. Automatic build latest checked `2026-11-04T10:00:32Z: build OK`; no manual build/typecheck. Previous report below is historical, not current completion.

## Completed
- CourseAboutTab: both inline grids now use `gridTemplateColumns: 'minmax(0, 1fr)'`; all other grid properties unchanged.
- LocationMapCard: footer location no longer has `overflow: hidden`, `textOverflow: ellipsis`, or `whiteSpace: nowrap`; now `lineHeight: 1.3`, `overflowWrap: anywhere`. Directions retains `flexShrink: 0`.
- ClaimedCourseProfileLink: name replaces the same three clipping properties with `lineHeight: 1.3`, `minWidth: 0`, `overflowWrap: anywhere`; Visit profile retains `flexShrink: 0` and adds `whiteSpace: nowrap`.
- TourIsland: shell/control/text column can shrink, shell/control hide overflow and caption ellipsises; label has no truncation properties.
- ChromeIsland: `/tourhub` only gets left capsule minWidth0/overflow hidden, and guest/member right flexShrink0. No guest content, action or gate changed.

## Blockers — no full completion claimed
1. §2 says “Every inline style object in src/**/*.tsx (excluding tests)” must change, while the same brief says “Do not touch … the review wizard”. The AST audit finds review-wizard objects in `src/features/review-v2/components/MediaTray.tsx:130`, `src/features/review-v2/components/VoiceDictateButton.tsx:498`, plus the shared `src/features/composer-flow/components/ComposerStepHeader.tsx:56`. These cannot both be satisfied without a scope ruling. App-wide edits and the app-wide guard are deferred; no exemptions silently invented.
2. Real browser `/tourhub` at320: left edges12→131.640625; guest right139.640625→308. Both capsules fit the12px edges, but screenshot shows the label clipped (not complete “All tours”). Guest capsule is168.359375px, not the brief’s138px. The remaining left119.640625px cannot hold the preserved icon, label, arrow, gaps and padding. Label styles remain untruncated, but ancestor clipping is not acceptance. Additional geometry/content changes require a ruling; no unauthorized padding/font/content changes made.
3. Authenticated member browser check unavailable (`external_unmanaged`); no session or gate bypass. Course five-tab/320–390 live coverage not completed in this scoped stop. No claim that all app overflow is eliminated.

## Tests / build
Before:6625 tests in584 files (OVERVIEW_RHYTHM_REPORT.md). After:6633 tests in585 files, +8 tests/+1 file, entirely `src/test/fixOverflowSource.test.ts`:
1. About stack and claimed-profile wrapper use shrinkable single columns
2. map footer location wraps without clipping
3. Directions remains non-shrinking
4. claiming business name wraps and can shrink
5. Visit profile remains non-shrinking and on one line
6. Tour island shell, control and text column can shrink
7. Tour caption gives way before the untruncated tour label
8. Tour-only capsule rules shrink left and preserve member and guest right
Source tests do not establish real browser label fit; the failed visual acceptance above takes precedence.
No existing tests deleted, renamed or rewritten. No existing map/business nowrap assertions found to update. No test assertion diffs. No pre-existing or new failing tests.
Focused command: `bunx vitest run src/test/fixOverflowSource.test.ts src/test/tourIsland.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx --maxWorkers=2`:48/48.
Full commands: `bunx vitest run --maxWorkers=2 --shard=n/4` for n=1,2,3,4:
- Shard1:1708/1708,147 files
- Shard2:1588/1588,147 files
- Shard3:1676/1676,147 files
- Shard4:1661/1661,144 files
Total6633/6633,585 files, zero failures and zero unhandled errors. All full output retained in docs/verification/fix-overflow-1/shard-*.log. Existing React act warnings are warnings, not unhandled errors.
Automatic build log latest observed:2026-11-04T09:39:23Z, `build OK`. No manual build/typecheck.
Browser screenshot `/tmp/browser/fix-overflow-1/tour-320.png` inspected; clipping is visible.

## Files touched
- src/components/courses/course-detail/CourseAboutTab.tsx
- src/components/map/LocationMapCard.tsx
- src/components/courses/course-detail/ClaimedCourseProfileLink.tsx
- src/features/tourhub/components/TourIsland.tsx
- src/features/chrome-v2/ChromeIsland.tsx
- src/test/fixOverflowSource.test.ts (new)
- roadmap.md
- FIX_OVERFLOW_1_REPORT.md (new)
- docs/verification/fix-overflow-1/{focused.log,shard-1.log,shard-2.log,shard-3.log,shard-4.log,inline-grid-before.json,tailwind-grid-audit.json}
- Project memory index and new overflow-containment requirement.
No SQL, migration, deployed RPC/edge, feed_config, pool cap, native/Median, news or round plot edits. Protected wizard edits deferred.

## Inline grid inventory (before)
Actual AST inventory:55 objects across41 files, not44/33. Direct inline style objects only; no spread-injected column inference. Only CourseAboutTab’s2 objects changed; remaining53 deferred until scope is resolved. Full snippets/lines:docs/verification/fix-overflow-1/inline-grid-before.json.

|File|Objects before|Changed|
|---|---:|---:|
|`src/components/awards/AwardMark.tsx`|1|0|
|`src/components/business/BusinessEmptyState.tsx`|1|0|
|`src/components/chrome/AppHeader.tsx`|2|0|
|`src/components/chrome/FixedPageHeader.tsx`|1|0|
|`src/components/courses/course-detail/CourseAboutTab.tsx`|2|2|
|`src/components/courses/course-detail/CourseRecordBook.tsx`|2|0|
|`src/components/courses/course-detail/about/AllHolesSheet.tsx`|1|0|
|`src/components/courses/course-detail/about/KeepExploring.tsx`|1|0|
|`src/components/courses/course-detail/about/RecordBook.tsx`|2|0|
|`src/components/courses/course-detail/you/YourHolesSheet.tsx`|1|0|
|`src/components/courses/course-detail/you/YourRoundsHere.tsx`|1|0|
|`src/components/courses/top100/top100Shells.tsx`|2|0|
|`src/components/explore-tab-new/FindGolfersSheet.tsx`|1|0|
|`src/components/profile/handicap/whs/connect/EmptyStateScreen.tsx`|3|0|
|`src/features/admin/components/analytics/AnalyticsLenses.tsx`|1|0|
|`src/features/admin/components/analytics/HealthLens.tsx`|1|0|
|`src/features/admin/components/analytics/LiveLens.tsx`|1|0|
|`src/features/admin/components/content/ContentSegments.tsx`|1|0|
|`src/features/admin/components/content/StorySection.tsx`|1|0|
|`src/features/admin/components/content/TourDataSection.tsx`|1|0|
|`src/features/admin/components/health/GolfDataLens.tsx`|1|0|
|`src/features/admin/components/health/JobsLens.tsx`|1|0|
|`src/features/admin/pages/SettingsPage.tsx`|1|0|
|`src/features/composer-flow/components/ComposerStepHeader.tsx`|1|0|
|`src/features/courses/components/holes/analytical/CourseCardPanel.tsx`|3|0|
|`src/features/echo-chat/components/CompareBars.tsx`|1|0|
|`src/features/echo-chat/components/ComposerPill.tsx`|1|0|
|`src/features/echo-chat/components/StateCards.tsx`|2|0|
|`src/features/echo-chat/components/ThinkingSources.tsx`|2|0|
|`src/features/echo-chat/components/ThreadPrimitives.tsx`|1|0|
|`src/features/post-v2/components/golf/GolfPostSections.tsx`|2|0|
|`src/features/post-v2/components/golf/PostPreview.tsx`|1|0|
|`src/features/review-v2/components/MediaTray.tsx`|1|0|
|`src/features/review-v2/components/VoiceDictateButton.tsx`|1|0|
|`src/features/tourhub/players-v2/PlayerCell.tsx`|1|0|
|`src/features/tourhub/players-v2/field/FormTiles.tsx`|1|0|
|`src/features/tourhub/players-v2/field/FullField.tsx`|1|0|
|`src/features/tourhub/players-v2/front/FrontPage.tsx`|1|0|
|`src/features/tourhub/players-v2/picks/LinePicksCard.tsx`|1|0|
|`src/features/tourhub/tournament-v2/sections/TournamentHoleRow.tsx`|2|0|
|`src/pages/EchoV2Page.tsx`|2|0|

## Tailwind grid inventory — unchanged
No unprefixed grid-cols-* token:
- `src/components/ui/alert-dialog.tsx:40`: `fixed left-[50%] top-[50%] z-[201] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-sq-lg`
- `src/components/ui/radio-group.tsx:14`: `grid gap-2`
- `src/components/ui/drawer.tsx:73`: `grid gap-1.5 p-4 text-center sm:text-left`
- `src/components/ui/dialog.tsx:39`: `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/10 bg-card p-6 text-card-foreground shadow-lg transition-all duration-motion-medium ease-standard`
- `src/components/courses/review/RatingTierDistribution.tsx:55`: `grid items-center gap-x-2 gap-y-2`
- `src/pages/BusinessDirectoryPage.tsx:158`: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
- `src/pages/BusinessDirectoryPage.tsx:180`: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
- `src/components/profile/SortViewModal.tsx:48`: `fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border-0 bg-transparent p-0 shadow-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg`
- `src/components/profile/edit-v2/ImageCropperModal.tsx:184`: `fixed left-[50%] top-[50%] z-[200] grid w-full max-w-lg sm:max-w-xl translate-x-[-50%] translate-y-[-50%] p-0 gap-0 overflow-hidden border border-white/10 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95`

BusinessDirectoryPage’s two occurrences do have md:grid-cols-2/lg:grid-cols-3; they are listed for the unprefixed single-column base, not claimed columnless at every breakpoint. Static literals only; dynamically constructed/imported classes not resolved.
