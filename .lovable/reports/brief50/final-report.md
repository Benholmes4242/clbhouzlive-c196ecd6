# Brief 50 — final report (Parts A–G)

Close-out commit: see git log (after c47615e219). No SQL, no migrations; feed_config untouched; round_pool_cap 30.

## Rulings applied (28 Nov, 14:52)
1. Played hooks moved into `WithPlayedTick` (src/features/played/PlayedTick.tsx). `BrowseCourseCard` and `CourseListRow` render it only when `playedTick` is set; otherwise the body gets `OFF_TICK` and calls no new hooks. No test edits. This cleared the 26 shard-1 QueryClient failures (courseCardV3 ×9, courseListViewToggle ×17).
2. Sheet colour: Tick off courses sheet uses the shared sheet standard #16161A (brief said #121216; sheet primitive forbids a custom colour). Accepted.
3. Rating figures white: card you-line number now #F8FAFC 700 (`.pl-you .sc`); Tick off sheet locked rated figure #F8FAFC (`.pl-lockd b`); course page "Rated 9.6" button was already #F8FAFC (no data-on). Green stays on the tick, the PLAYED/RATED pill and the course-page "Played" toggle state only.
4. get_played_unrated_courses null last_played: Courses rate nudge shows no date at all (only region); profile prompt uses playDateStandalone (null → ''); picker formatDate (null → '') with undated rows banded "earlier". No code change needed; one test each in src/test/brief50NullLastPlayed.test.tsx.

## Tests — four sequential shards (`npx vitest run --shard=N/4`)
| shard | files | tests |
|---|---|---|
| 1 | 242 | 2,618 |
| 2 | 242 | 2,574 |
| 3 | 242 | 2,781 |
| 4 | 239 | 2,927 |
| **total** | **965** | **10,900** | zero failures |

Baseline 10,867 / 961 → +33 / +4. Reconciled by file against the Brief 48D shard logs:
- src/test/brief50Played.test.tsx — 19 (new)
- src/test/brief50Reminders.test.ts — 3 (new)
- src/test/brief50ProfileCourses.test.tsx — 7 (new, Part G)
- src/test/brief50NullLastPlayed.test.tsx — 3 (new, ruling 4)
- src/test/weightCanonSweep.test.ts — 178 → 179: parameterised per CSS file; the new src/features/played/played.css adds one case. No source edit to the test.
No test deleted, renamed or rewritten. Logs: shards/s1–s4.log.

## A6 — user_course_activity consumer audit (played_at NULL for ticked-only)
- useTop100ProgressForUser — changed: recent rounds filter out null played_at (`datedRecentTop100`); year/streak reads use played_at gte/lt, which never match NULL.
- useUserCourseSummary — no change: counts rows and countries, no dates; map is source-agnostic (ticked course plotted when it has coordinates, else "unmapped"; tested).
- useUserCourseActivity — no change: orders played_at desc nullsFirst false (nulls last).
- ProfilePageV2 — no change: count only via the summary hook.
- useTop100Enrichment — no change: existence check only.
- YourHundredSection — no change: membership only (ticks now count as yours, intended).
- useFriendsTop100Progress — changed (A5): total from user_course_activity × active lists.
- useFeaturedSignals — no change: has_played only, no date.
- useUserAnalyticsCourses — no change: reads gam_user_courses RPC (rounds), not played_at.
- JourneySummaryCard — no change: count only.
- YourCourseAnalyticsSheet — no change: date printed only when last_played is non-null.
- AllCoursesList / DossierCard (Part G) — changed: ticked-only rows render no date, own/other line 2, nulls-last recency sort, Remove from played.

## Deploy
- process-push-queue redeployed: source SHA-256 0f70e7f2221cdc5cdfc660925ff24ebf49a5c03099c7f0927d1a54954901dd16. Live push not verified.
- played-rating-reminders: DEPLOYED (no code changes). Source SHA-256 9854d7375b7598b867f0204e0ee00737acffaa1046c6c711103f4b58d73d8f1b. Live check: POST without `x-internal-secret` returns 401 {"error":"Unauthorized"} — reachable and failing closed as designed. NOT scheduled; Ben adds the nightly schedule.

## Screenshots (screenshots/)
Signed-in sessions cannot be created for this project, so the captures are **test data**: the real dev app with real public course data, a fixture session, and a stubbed get_my_played_courses response (rotating rated 9.6 / ticked / 3 rounds / unticked over the listed courses). All other reads are real, made anonymously.
- Courses list, card view: courses-card1–3-{390,320}.png; list view: courses-list-{390,320}.png
- Top 100 list, card view: courses-top100-card1–3-{390,320}.png; list view: courses-top100-list-{390,320}.png
- Overflow check: page scrollWidth equals the viewport at 390 and 320; 0 of the first 40 rows overflow; names ellipsise before the tick.
**Not captured:** Tick off courses sheet, course page row + nudge, Waiting for your rating, leaderboard rows, profile Courses tab (Part G). Ben checks these signed-in on device instead of captures.

## Status
Brief 50 CLOSED. Signed-in screens are Ben's device check, not agent captures.
