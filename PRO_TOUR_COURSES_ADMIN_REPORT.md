# PRO_TOUR_COURSES_ADMIN report

## Built

- Added `useProTourCourses(userId)` reading `get_pro_tour_courses` once per profile with a 60-second stale time. Failures log and return an empty map so the ordinary archive still renders.
- `AllCoursesList` now passes one tour-event lookup to every archive `DossierCard`: year-sorted rows, rating-sorted rated rows and NOT YET RATED rows.
- Archive rows with a tour event now take line 1 from the event date and replace the rounds/average line with `On tour · event · finish`; finish labels reuse `finishLabel` (`2` → `2nd`, `T26`/`MC` unchanged). Ratings, thumbnails, ranks, chevrons and expansion are unchanged.
- Added the English `courses.row.onTour = "On tour"` copy.
- Added OWGR geography rules mirroring the database: USA aliases match the `USA` grouping, Korea aliases match `South Korea`, all other events match `sub_country`, and blank event countries fail closed.
- Added the admin `Ranking event courses` page with the VenueMapping structure: filters, summary, DataList columns/cards, event sheet, played/reason copy, compatible and different-place candidates, link/no-course confirmations, add-course handoff and all four required cache invalidations.
- Added the inbox Tools row and `/admin-v2/inbox/ranking-events` route. Tools now shows for open admin users even when the course-matching workbench is empty; the workbench row itself remains count-gated.

## Files changed

- `src/hooks/useProTourCourses.ts` — new.
- `src/components/profile/courses/AllCoursesList.tsx` — hook wiring, three card call sites, malformed-cache guard.
- `src/components/profile/courses/DossierCard.tsx` — optional archive tour event line/date.
- `public/locales/en/courses.json` — one copy key.
- `src/lib/tourhub/owgrEventGeography.ts` — new.
- `src/features/admin/pages/rankingEventRules.ts` — new.
- `src/features/admin/pages/RankingEventCoursesPage.tsx` — new.
- `src/features/admin/pages/InboxPage.tsx` — route, count hook and Tools row.
- `src/test/owgrEventGeography.test.ts` — new, 6 tests.
- `src/features/admin/pages/rankingEventRules.test.ts` — new, 5 tests.
- `src/components/profile/courses/DossierCard.metaLines.test.tsx` — extended from 3 to 8 tests and added the required `initReactI18next` mock export; no pre-existing assertion was changed.

No tests were deleted or renamed. No SQL, migration file, `feed_config`, native or Median change was made.

## Verification

- Focused: 25/25 passed (`owgrEventGeography`, `rankingEventRules`, `DossierCard.metaLines`, `profileCoursesRecord`).
- Type check: `oj typecheck -b --noEmit` passed.
- Shard 1: 1,923 tests / 163 files passed.
- Shard 2: 1,791 tests / 163 files passed.
- Shard 3: 1,899 tests / 163 files passed.
- Shard 4 first run stopped on `src/test/profileCoursesVoice.test.tsx`: `tourByCourse.get is not a function` from an older partial React Query mock returning an array. Fixed in product by ignoring a non-Map cached value; focused regression passed 1/1.
- Shard 4 rerun: 1,826 tests / 162 files passed.
- Final total: 7,439 tests / 651 files passed, zero failures. Previous baseline was 7,423 / 649; delta is +16 tests and +2 test files, exactly the new geography/rules/Dossier cases.
- The permitted known `fw1FeaturedDeck` meta-line failure did not occur.
- Latest preview build: OK at 2026-11-07T14:23:53Z.

## Signed-off mock comparison — 7 November 2026

- The missing `pro-courses-and-event-matching-signed-off.html` was supplied and compared with all four implemented views and the original BUILD brief. No product or test changes were required.
- Archive tour-date and finish lines match the changed scope. The live `user_course_activity` view is explicitly the owner of tour-course inclusion and event-date grouping; `useUserCourseActivity` maps `played_at` to `last_played_at`. No client union or regrouping was added. Hosted data remains unverified.
- The existing summary, year headings, ratings, thumbnails and expansion remain unchanged as required. The mock's sample course totals, ratings and rated-only courses were not copied into production.
- Admin list states, metadata, filters, sheet copy/search/actions and the Inbox Tools entry match the original brief. The new Tools row has no special highlight, and its zero-count fallback follows the original brief.
- One shared-pattern difference is retained: the mock displays `Different place (0)` while the existing VenueMapping pattern and new page show the divider only when incompatible candidates exist. The brief requires cloning the existing structure, so shared behavior was not restyled.
- Reference views were rendered at 320px without horizontal overflow. This checks the supplied mock only, not the authenticated implementation.
- No tests changed, were deleted or renamed, and no tests were rerun for this comparison. Full-suite inventory remains the previously executed 7,439 tests / 651 files; the four recorded shard counts are unchanged.

## 320px verification status

- The signed-off mock comparison is now complete; it was unavailable during the original build.
- Authenticated 320px checks are unavailable in this environment because the project uses externally managed authentication. Source checks confirm the archive tour lines use nowrap ellipsis inside a `minWidth: 0` identity column, and the admin sheet footer uses `flexWrap: 'wrap'`; live archive/list/sheet overflow on a device remains for Ben to verify.
