import { useQueryClient } from '@tanstack/react-query';

interface RatingAggregates {
  avg_overall_score: number | null;
  review_count: number;
}

interface OptimisticUpdateContext {
  previousData: RatingAggregates | undefined;
  courseId: string;
}

/**
 * Hook for managing optimistic cache updates when submitting/editing course ratings.
 * Provides instant UI feedback while the mutation is in progress.
 */
export function useOptimisticRatingUpdate() {
  const queryClient = useQueryClient();

  /**
   * Optimistically update the rating aggregates cache for a new rating.
   * Call this in onMutate of your rating submission mutation.
   */
  const optimisticNewRating = async (
    courseId: string,
    newRating: number
  ): Promise<OptimisticUpdateContext> => {
    // Cancel any outgoing refetches so they don't overwrite our optimistic update
    await queryClient.cancelQueries({
      queryKey: ['course-rating-aggregates', courseId],
    });

    // Snapshot the previous value for rollback
    const previousData = queryClient.getQueryData<RatingAggregates>([
      'course-rating-aggregates',
      courseId,
    ]);

    // Optimistically update the cache with new calculated average
    if (previousData && previousData.avg_overall_score !== null) {
      const newCount = previousData.review_count + 1;
      const newAverage =
        (previousData.avg_overall_score * previousData.review_count + newRating) / newCount;

      queryClient.setQueryData(['course-rating-aggregates', courseId], {
        avg_overall_score: Math.round(newAverage * 10) / 10,
        review_count: newCount,
      });
    } else if (previousData) {
      // First rating on a course with no previous ratings
      queryClient.setQueryData(['course-rating-aggregates', courseId], {
        avg_overall_score: Math.round(newRating * 10) / 10,
        review_count: 1,
      });
    }

    return { previousData, courseId };
  };

  /**
   * Optimistically update the rating aggregates cache for an edited rating.
   * Call this in onMutate when the user is updating an existing rating.
   */
  const optimisticEditRating = async (
    courseId: string,
    newRating: number,
    previousRating: number
  ): Promise<OptimisticUpdateContext> => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({
      queryKey: ['course-rating-aggregates', courseId],
    });

    // Snapshot the previous value for rollback
    const previousData = queryClient.getQueryData<RatingAggregates>([
      'course-rating-aggregates',
      courseId,
    ]);

    // Optimistically update: replace old rating with new one (count stays same)
    if (previousData && previousData.avg_overall_score !== null && previousData.review_count > 0) {
      const totalSum = previousData.avg_overall_score * previousData.review_count;
      const newSum = totalSum - previousRating + newRating;
      const newAverage = newSum / previousData.review_count;

      queryClient.setQueryData(['course-rating-aggregates', courseId], {
        avg_overall_score: Math.round(newAverage * 10) / 10,
        review_count: previousData.review_count, // unchanged
      });
    }

    return { previousData, courseId };
  };

  /**
   * Rollback to previous data on mutation error.
   * Call this in onError of your rating submission mutation.
   */
  const rollback = (context: OptimisticUpdateContext | undefined) => {
    if (context?.previousData) {
      queryClient.setQueryData(
        ['course-rating-aggregates', context.courseId],
        context.previousData
      );
    }
  };

  /**
   * Schedule a background sync after optimistic update settles.
   * Call this in onSettled to ensure eventual consistency with server.
   */
  const scheduleBackgroundSync = (courseId: string, delayMs: number = 10000) => {
    setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: ['course-rating-aggregates', courseId],
      });
    }, delayMs);
  };

  return {
    optimisticNewRating,
    optimisticEditRating,
    rollback,
    scheduleBackgroundSync,
  };
}
