import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate every query cache that depends on course_ratings data.
 * Call after ANY course rating/review submission (useSubmitRating,
 * useReviewWizard, AddToPlayedModal, CoursePickerModal).
 *
 * Uses exact: false so partial-key matches (e.g. ['userProfile', id]) all fire.
 */
export function invalidateCourseRatingCaches(queryClient: QueryClient) {
  // ── Course detail surfaces ──
  queryClient.invalidateQueries({ queryKey: ['course-rating-stats'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['course-rating-distribution'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['course-reviews-full'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['course-personal-status'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-course-rating'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-played-course'], exact: false });

  // ── Profile → Courses tab ──
  queryClient.invalidateQueries({ queryKey: ['user-played-courses-full'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-course-activity'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-course-reviews'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-avg-rating'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-course-ratings'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-course-ratings-breakdown'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['played-courses-with-averages'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-played-courses-for-top10'], exact: false });

  // ── Profile → Personal Top 10 ──
  queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['userTopTenCourses'], exact: false });

  // ── Profile → Top 100 tab ──
  queryClient.invalidateQueries({ queryKey: ['userTop100Courses'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-top100-courses'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-progress-user'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-progress-for-user'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-overview'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-pilgrimage'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-list-summaries'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-highlights'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100CoursesByRegion'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-leaderboard'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['top100-course-leaderboard'], exact: false });

  // ── Profile header stats (courses_logged denormalized column) ──
  queryClient.invalidateQueries({ queryKey: ['userProfile'], exact: false });

  // ── Other surfaces ──
  queryClient.invalidateQueries({ queryKey: ['user-course-summary'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['user-want-to-play'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['friends-courses'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['golf-courses-infinite'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['explore-courses'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['quest-courses'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['userPlayedCourses'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['allPlayedCourses'], exact: false });
}
