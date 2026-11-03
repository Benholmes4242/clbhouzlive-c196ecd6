# HB3_COURSES — COMPLETE

## Scope and implementation
- Exact `/courses` now uses Clubhouse's soft scrim, fixed logo islands and condense opt-in (which supplies the existing squircle treatment); removed its `scrollAway`. Course detail/deeper route rules are untouched.
- CoursesContent supplies the existing under-hero switch anchor and renders a persistent docked CoursesShellTabs copy using the same activeTab and handleTabChange. Both browse and Top 100 retain their original section placement. Other callers do not opt into the dock.
- CoursesShellTabs has an optional docked presentation that removes only its in-flow padding. IslandDock supplies the 16px gutters, top, motion, accessibility lifecycle and glass. IslandDock and its CSS were not edited.
- Guest browsing, hero, course sections, right island, bottom navigation, review wizard, news, round plots, SQL/migrations, deployed RPCs/edge functions, feed_config and native/Median configuration untouched; round_pool_cap remains 30.

## Files touched
1. `src/features/chrome-v2/registry.ts`
2. `src/features/courses/components/CoursesShellTabs.tsx`
3. `src/components/courses/CoursesContent.tsx`
4. `src/test/hb3CoursesDock.test.tsx` (new)
5. `AGENTS.md` (ownership rule)
6. `roadmap.md`
7. `HB3_COURSES_REPORT.md` (new)
8. Project memory: `mem://features/chrome/hb3-courses.md`, `mem://index.md`

## Test inventory and reconciliation
Last reported full-suite baseline: **6,262 tests / 559 files** (HB2).
Final: **6,268 tests / 560 files**, all passing. Delta **+6 tests / +1 file** solely `hb3CoursesDock.test.tsx`.
No existing test was changed, deleted, renamed or rewritten; no authorized duplicate-query or partial-mock correction was needed. No existing `/courses` scrollAway assertion was found requiring replacement.

Six added cases, by exact name:
1. `/courses uses Clubhouse soft fading and squircle condensation without scrollAway`
2. `docks only above the island boundary while islands are open`
3. `keeps the hidden docked switch mounted inert and aria-hidden`
4. `shares selection between docked and in-place switches`
5. `marks only the selected docked segment for shared selected-glass treatment`
6. `preserves course detail and deeper route chrome`

The selected-glass case asserts the structural selected marker consumed by the unchanged shared CSS; resolved paint is verified in Chromium, not jsdom.

Focused command:
```text
bunx vitest run src/test/hb3CoursesDock.test.tsx src/test/hb2ExploreDock.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/components/courses/Top100CoursesHubPanel.test.tsx --maxWorkers=2
Test Files  5 passed (5)
     Tests  44 passed (44)
EXIT=0
```
Full-suite commands and counts:

| Command | Passed tests | Passed files |
| --- | ---: | ---: |
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,581 | 140 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,520 | 140 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,546 | 140 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,621 | 140 |
| Total | **6,268** | **560** |

Every shard exited 0; zero failed tests/suites and zero Vitest unhandled errors. Shard allocation changed because adding the file shifts alphabetical shard boundaries: baseline 1,581/1,524/1,546/1,611 becomes 1,581/1,520/1,546/1,621; the aggregate delta is exactly +6.
Full logs retained at `/tmp/hb3/focused.log` and `/tmp/hb3/shard-{1,2,3,4}.log`. No new or unresolved pre-existing failure encountered. Existing React act warnings are warnings, not Vitest unhandled errors.

## Real-browser verification
Fresh Chromium at 390×844 on live `/courses`; browser response only injects `--sat:47px` before mount, with no product fixture or guest bypass. Real `#root` is the page scroller, clientHeight844 and scrollHeight6107.
- Rest: `/tmp/browser/hb3/rest.png`.
- Down to500: folded left island **46px**, dock `data-shown=false`, opacity0. `/tmp/browser/hb3/folded.png`.
- Up to450: expanded left island131px, dock `data-shown=true`, opacity1, top **109px**. `/tmp/browser/hb3/docked.png`.
- Selected Courses: background `rgba(40, 40, 46, 0.9)`, edge `rgba(255, 255, 255, 0.28)`.
- Unselected Top 100: background `rgba(14, 14, 16, 0.84)`, hairline `rgba(255, 255, 255, 0.1)`.
- Both compute `blur(22px) saturate(1.5)`; shared stylesheet includes the WebKit declaration. Existing canonical radius stays11px.
- Docked Top 100 tap updates the in-place selected segment and URL to `/courses?tab=top100`; screenshot `/tmp/browser/hb3/top100.png`.
- Guest right capsule outerHTML byte-identical through down/up. No page errors. Folded/docked screenshots inspected visually.
- Final output `/tmp/hb3/browser-final.log`. The first capture ran while content was settling and hit the unchanged guest lock; it was replaced by a fresh stable run at500/450 before the lock, without app changes.

## Mock boundaries and limits
HB2's explicitly repeated paint ruling governs the mock's blur-only paint. Canonical owned RailChips geometry remains11px radius (mock13px), existing chip height/type/gap preserved as the brief says each segment keeps its own treatment; the page hero/content and guest right capsule remain the build rather than mock examples. No claim of signed-in right-island parity or authenticated member readback: this project's authentication is external_unmanaged. The live signed-out dock-to-Top100 flow and shared-component tests were verified.

## Build
Latest automatic preview build entry, read after completed edits:
```text
=== build 2026-11-03T15:34:21Z ===
build OK
```
No manual build/typecheck was run, per environment policy. The referenced older chrome memory paths were unavailable; HB3's explicit repeated ruling and the existing shared tokens supplied the authoritative paint.