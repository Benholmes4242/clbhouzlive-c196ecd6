# Brief 33 — course page clbhouz Ten standing

## Result

Implemented the signed-off course standing card and public-member sheet. The card follows the selected course under both `CourseTitleOverlay` layouts and precedes the existing tabs/content. A null RPC result returns no wrapper, card, sheet or gap. `See chart ›` opens Brief 32's `ClbhouzTenSheet` on Everyone with `highlightCourseId` set to the current course. Member rows target `/profile/<username or id>?tab=courses&course=<course_id>`.

The existing `get_course_top_ten_standing` signature was already in `src/integrations/supabase/types.ts`; no generated-type edit was needed. The read uses query key `['course-top-ten-standing', courseId]` and a five-minute stale time. No browser-side membership reconstruction or private/restricted-ten read was added.

## First-paint gate

Used the existing `CourseDetailSkeleton` gate in `GolfClubView`: `courseTopTenStandingPending` now settles alongside the course hero read before the page renders. This covers standalone and modal layouts and prevents a late card pushing the page down. A settled error renders no card; null renders no card or gap.

## Files changed

Production:
- `src/components/golf-club/GolfClubView.tsx`
- `src/components/courses/course-detail/CourseTopTenAvatar.tsx`
- `src/components/courses/course-detail/CourseTopTenMembersSheet.tsx`
- `src/components/courses/course-detail/CourseTopTenStandingCard.tsx`
- `src/components/courses/course-detail/courseTopTenRules.ts`
- `src/components/courses/course-detail/courseTopTenStanding.css`
- `src/components/courses/course-detail/useCourseTopTenStanding.ts`

Tests and documentation:
- `src/test/brief33CourseTopTen.test.tsx` (new)
- `src/test/ch1ChampionsTidy.test.tsx` (authorised setup-only stub)
- `src/test/courseHeroesMatch.test.tsx` (authorised setup-only stub)
- `src/test/g2aCourseTabs.test.tsx` (authorised setup-only stub)
- `roadmap.md`
- this report, captures and logs

## Tests and stopped run

Focused command after the authorised stubs:
`bunx vitest run src/test/brief33CourseTopTen.test.tsx src/test/courseHeroesMatch.test.tsx src/test/g2aCourseTabs.test.tsx src/test/ch1ChampionsTidy.test.tsx`
Result: **30/30 tests, 4/4 files passed**, including all nine new Brief 33 cases.

The initial focused run stopped with 11 existing failures and 19 passes. The new nine cases passed; the three existing page fixtures remained on the skeleton because they had no settled standing read:
- `src/test/courseHeroesMatch.test.tsx:68`: `expected  to have a length of 1 but got +0`
- `src/test/g2aCourseTabs.test.tsx:36`: `Error: Missing [data-course-review-tabs]` (also its docked-control variant)
- `src/test/ch1ChampionsTidy.test.tsx:97`: `Unable to find an accessible element with the role "button" and name "What you could take here You tab ›"`

Ben authorised settled null-standing stubs only. Each of those three files gained exactly:
`vi.mock('@/components/courses/course-detail/useCourseTopTenStanding', () => ({ useCourseTopTenStanding: () => ({ data: null, isPending: false }) }));`
No existing test name, assertion or case count changed. No test was deleted, renamed or rewritten.

Final full-suite commands, run separately and sequentially:
| Command | Tests | Files |
| --- | ---: | ---: |
| `bunx vitest run --shard=1/4` | 2,563 | 234 |
| `bunx vitest run --shard=2/4` | 2,561 | 234 |
| `bunx vitest run --shard=3/4` | 2,768 | 234 |
| `bunx vitest run --shard=4/4` | 2,825 | 232 |
| **Total** | **10,717** | **934** |

Brief 32 baseline: 10,708 tests / 933 files. Delta: **+9 tests / +1 file**, entirely `brief33CourseTopTen.test.tsx`. No existing assertions changed. Full output is retained in `logs/shard-{1,2,3,4}.log`. Preview build log reads `build OK` after the edits.

The nine new cases cover: null rendering; all six movement states and up/down colour bindings; record priority and singular wording; Monday chart joining; one/two/four #1 names; exact sheet sentence and Picked/From her ratings; member destination; Everyone chart highlighting props; and opening the full member list.

## Browser evidence

Public live data, Royal County Down Golf Club (Championship), in six public tens:
- `captures/live-card-390.png`
- `captures/live-card-375.png`
- `captures/live-card-320.png`
- `captures/live-sheet-390.png`
- `captures/live-sheet-320.png`

At 390/375/320 the card measured 358/343/288px wide with document width equal to viewport width and no page errors. The members sheet listed all six live public entries. The Everyone chart loaded 50 rows and exactly one highlighted current-course row at every width.

Null live standing, Royal Lytham & St Annes Golf Club:
- `captures/live-no-card-390.png`
- `captures/live-no-card-320.png`

No card or 16px gap appears; the existing hero flows directly into the existing tabs, with no horizontal overflow or page errors.

`captures/fixture-wrapped-record-320.png` is explicitly a network-response fixture, not live data: rank #100, No change this week and 123 weeks on the chart forced the record onto its own line. Its record measured `margin-top: 6px`, below the unwrapped rank/movement group. Live movement remained null in this first chart week, so no live non-null movement is claimed.

A signed-out live member-row tap was redirected to `/auth`. Signed-in preview session minting is unavailable because this project's Supabase backend is user-managed. Therefore live signed-in profile landing and Brief 31 band opening are not claimed; the jsdom navigation case verifies `/profile/thomas?tab=courses&course=course-1`.

## Boundaries

No SQL, migration, database write, deployment, trigger or schedule. `feed_config` untouched; `round_pool_cap` remains 30. No security findings were fetched and no remediation or `Fix all` action was performed.
