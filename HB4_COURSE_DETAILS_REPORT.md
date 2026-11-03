# HB4_COURSE_DETAILS — STOP

## Failure and status
Implementation is present; focused verification stopped on one new test failure. No correction, rerun, full shards or browser/mock scrolling followed the failure. Automatic preview build is clean. No pre-existing failing test was encountered; the existing islandSquircle act warning remains a warning.

```text
FAIL  src/test/hb4CourseBackName.test.tsx > HB4 course detail back name > fits a long name down to the 13px floor without changing the text
AssertionError: expected 'A very long championship…' to be 'A very long championship course name' // Object.is equality

Expected: "A very long championship course name"
Received: "A very long championship…"

❯ src/test/hb4CourseBackName.test.tsx:70:74
expect(span?.style.fontSize).toBe('13px'); expect(span?.textContent).toBe(name);
```
The 13px floor assertion passed; the subsequent text assertion failed because the fixture passes its long name through canonical shortCourseName, which returns the shortened form. Product and assertion remain unchanged after the stop. Full output: `/tmp/hb4/focused.log`.

## Implementation
- User clarified existing `/courses/{courseId}` detail pages, not the brief's inconsistent `/courses/:x/:y` spelling. Registry keeps history back/fallback `/courses`, adds soft scrim and condensation, removes scrollAway. Deeper routes unchanged.
- New observer-only useIslandBackName publishes route-scoped short names through a tiny owner-guarded store; unmount clears only its own publication. Shared boundary extraction preserves the exact IslandDock calc probe, nonpositive fallback56 and observer behavior.
- Opted back capsule uses existing Button and useFitOneLine(16,13), with30px arrow,46px height/min-width,16px radius and padding0 7px. Named state adds8px gap/right15px, max-width/opacity transitions, semantic ink/glass tokens, and dynamic accessible label. Legacy back branch unchanged.
- GolfClubView observes the actual CourseMasthead heading through an opt-in nameRef. Hero name, styling, tabs and content remain unchanged.
- Module ownership is documented in new file headers; no cross-cutting architecture change was added to the nearly full root AGENTS.md.

## Files touched
1. `src/features/chrome-v2/islandBoundary.ts` (new)
2. `src/features/chrome-v2/islandBackNameStore.ts` (new)
3. `src/features/chrome-v2/useIslandBackName.ts` (new)
4. `src/features/chrome-v2/IslandBackCapsule.tsx` (new)
5. `src/features/chrome-v2/island-back.css` (new)
6. `src/features/chrome-v2/IslandDock.tsx` (boundary extraction only)
7. `src/features/chrome-v2/registry.ts`
8. `src/features/chrome-v2/ChromeIsland.tsx`
9. `src/index.css` (semantic back tokens)
10. `src/components/courses/CourseMasthead.tsx` (optional heading ref)
11. `src/components/golf-club/GolfClubView.tsx`
12. `src/test/hb4CourseBackName.test.tsx` (new,10 cases)
13. `src/test/hb3CoursesDock.test.tsx` (one authorized detail assertion)
14. `roadmap.md`
15. `HB4_COURSE_DETAILS_REPORT.md` (new)
16. Project memory `mem://features/chrome/hb4-course-details.md`, `mem://index.md`.

## Inventory and authorized existing change
Last full-suite baseline **6,268 tests / 560 files**. Candidate inventory **6,278 / 561**, +10/+1 solely hb4CourseBackName. This is NOT a full-suite passing total. No test deleted or renamed; no existing case-count change.

Existing case rewritten: `hb3CoursesDock.test.tsx`, “preserves course detail and deeper route chrome”. Exact assertion change:
```diff
-expect(resolveChrome('/courses/course-id', new URLSearchParams())).toEqual({ chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/courses' }, tone: 'dark', bleed: true, scrollAway: true });
+expect(resolveChrome('/courses/course-id', new URLSearchParams())).toEqual({ chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/courses' }, tone: 'dark', bleed: true, scrim: 'soft', condense: true });
```
Reason: HB4 explicitly authorizes updating the old detail scrollAway contract; the deeper-route assertions remain unchanged. IslandDock's HB2 tests are unchanged10/10 passing. No partial-mock or duplicate-query correction was needed.

Ten added cases:
1. opts existing course details into fixed soft folding chrome only
2. starts with the arrow-only back control and preserves its tap
3. shows the short course name only above the boundary and open, hiding on fold or return
4. updates the accessible label only while the name shows
5. fits a long name down to the 13px floor without changing the text (failed)
6. clears its published name when the hero unmounts
7. observes the actual heading using the shared 56px boundary and page root
8. uses IntersectionObserver only and shares boundary measurement with IslandDock
9. defines instant reduced-motion back and name transitions
10. does not leak a previous detail name into a different route

Command:
```text
bunx vitest run src/test/hb4CourseBackName.test.tsx src/test/hb2ExploreDock.test.tsx src/test/hb3CoursesDock.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/coursesHeroPlaceScrim.test.tsx --maxWorkers=2
Test Files  1 failed | 5 passed (6)
     Tests  1 failed | 53 passed (54)
EXIT=1
```
No Vitest unhandled error in this output. Full four shards not run after mandated stop.

## Build and outstanding verification
Latest automatic entry:
```text
=== build 2026-11-03T15:55:03Z ===
build OK
```
No manual typecheck/build. Rest46×46 browser proof, mock phone scrolling, down/up/name screenshots, resolved long-name/reduced-motion proof and four-shard final total remain unverified. External_unmanaged authentication prevents managed signed-in browser checks. Older HB3 memory reference was unavailable; source/report and repeated brief supplied context.

No guest browsing, review wizard, news, round plots, SQL/migrations, deployed RPC/edge functions, feed_config or native/Median configuration edited. round_pool_cap remains30. Course tabs were not docked.