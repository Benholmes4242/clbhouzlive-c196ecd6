import type { QueryClient } from '@tanstack/react-query';
import { FEED_QUERY_KEYS } from '@/lib/feedQueryKeys';


/**
 * Invalidate every query cache that depends on course_ratings data.
 * Call after ANY course rating/review submission (useSubmitRating,
 * review-v2 composer, AddToPlayedModal, CoursePickerModal).
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

  // ── Reviews count (profile header) ──
  queryClient.invalidateQueries({ queryKey: ['actor-reviews-count'], exact: false });

  // ── Reviewer aggregate stats (used by ReviewBottomSheet author card) ──
  queryClient.invalidateQueries({ queryKey: ['reviewer-stats'], exact: false });

  // ── Clubhouse + feed surfaces ──
  // These cache reviews shared as posts. Route through the canonical
  // FEED_QUERY_KEYS registry so every live feed refreshes; dead keys
  // (clubhouse-feed, clubhouse-posts, feed-posts, profile-feed, user-posts)
  // are retired.
  for (const key of FEED_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: key as unknown as readonly unknown[], exact: false });
  }
  queryClient.invalidateQueries({ queryKey: ['posts'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['profile-posts'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['actor-posts'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['userPosts'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['explore-content'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['feed-pinned'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['featured-post'], exact: false });
  queryClient.invalidateQueries({ queryKey: ['creator-features'], exact: false });
}
