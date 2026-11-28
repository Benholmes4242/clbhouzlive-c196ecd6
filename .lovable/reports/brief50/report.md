# Brief 50 — STOPPED at shard 1 (unexpected failures)

Commit under test: 2812b3a72b + one type fix (useTop100ProgressForUser datedRecentTop100 cast). Baseline 10,867 / 961.

Shard 1/4: 26 failed | 2,585 passed (2,611); files 2 failed | 239 passed (241). Shards 2–4 not run.
- src/test/courseCardV3.test.tsx — 9 cases
- src/test/courseListViewToggle.test.tsx — 17 cases
Error (both files): "Error: No QueryClient set, use QueryClientProvider to set one".
Cause: BrowseCourseCard and CourseListRow now call usePlayedTick (useQuery + useMutation) unconditionally, even without the playedTick opt-in, so tests rendering them without a QueryClientProvider throw. Not fixed, per the stop rule. Log: shard1-stop.log.

Proposed fix (needs approval): mount the played hooks only inside a child component rendered when playedTick is set, so cards without the opt-in call no new hooks. No test edits.

Built so far (not closed): Part A data layer (usePlayedCourses, useSetCoursePlayed, playedRules, useCoursePersonalStatus on the played rule, friends total on user_course_activity × active lists, recent rounds exclude undated ticks), Part B per Ben's ruling, Part C Your hundred + Tick off sheet, Part D course page row + nudge, Part E Waiting for your rating + leaderboard "<n> rated", Part F routes in both routers + played-rating-reminders function (x-internal-secret). New tests: brief50Played.test.tsx (19), brief50Reminders.test.ts (3), all passing.
Not yet: process-push-queue redeploy, four clean shards, captures, A6 audit write-up, final report.
Brief findings to record: sheet surface uses the canon BottomSheet surface (#16161A) because the sheet primitive forbids a custom colour (brief says #121216); ratings in #3DDC97 per brief/mock differ from the standing all-white ratings memory.
