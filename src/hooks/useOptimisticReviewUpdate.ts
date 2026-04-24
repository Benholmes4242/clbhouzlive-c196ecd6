/**
 * Optimistic Review Update Hook
 * 
 * Provides instant UI feedback for the user's own review actions,
 * with rollback capability on error. This ensures users see their
 * changes (add, edit, delete) immediately across all tabs.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { CourseRatingAggregate } from './useCourseRatingAggregates';

interface ReviewData {
  id?: string;
  user_id: string;
  course_id: string;
  rating: number;
  review?: string | null;
  design_score?: number | null;
  condition_score?: number | null;
  clubhouse_score?: number | null;
  facilities_score?: number | null;
  review_date?: string;
  created_at?: string;
  updated_at?: string;
  helpful_count?: number;
  unhelpful_count?: number;
  is_mock?: boolean;
  user_profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
  media?: unknown[];
  _isOptimistic?: boolean;
}

export interface OptimisticSnapshot {
  previousReviews: unknown;
  previousUserRating: unknown;
  previousAggregates: unknown;
  previousDistribution: unknown;
}

export function useOptimisticReviewUpdate() {
  const queryClient = useQueryClient();

  /**
   * Cancel outgoing refetches for all review-related queries
   */
  const cancelQueries = useCallback(async (courseId: string, userId: string) => {
    await Promise.all([
      queryClient.cancelQueries({ queryKey: ['course-reviews-full', courseId] }),
      queryClient.cancelQueries({ queryKey: ['user-course-rating', courseId, userId] }),
      queryClient.cancelQueries({ queryKey: ['course-rating-aggregates', courseId] }),
      queryClient.cancelQueries({ queryKey: ['course-rating-distribution', courseId] }),
      queryClient.cancelQueries({ queryKey: ['club-media', courseId] }),
    ]);
  }, [queryClient]);

  /**
   * Take snapshot of current state for rollback
   */
  const takeSnapshot = useCallback((courseId: string, userId: string): OptimisticSnapshot => {
    return {
      previousReviews: queryClient.getQueryData(['course-reviews-full', courseId]),
      previousUserRating: queryClient.getQueryData(['user-course-rating', courseId, userId]),
      previousAggregates: queryClient.getQueryData(['course-rating-aggregates', courseId]),
      previousDistribution: queryClient.getQueryData(['course-rating-distribution', courseId]),
    };
  }, [queryClient]);

  /**
   * Call BEFORE mutation - sets optimistic state and returns rollback data
   */
  const optimisticAddReview = useCallback(async (
    courseId: string,
    userId: string,
    review: Partial<ReviewData>,
    userProfile?: { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null; }
  ): Promise<OptimisticSnapshot> => {
    await cancelQueries(courseId, userId);
    const snapshot = takeSnapshot(courseId, userId);

    const optimisticReview: ReviewData = {
      id: review.id || `optimistic-${Date.now()}`,
      user_id: userId,
      course_id: courseId,
      rating: review.rating || 0,
      review: review.review || null,
      design_score: review.design_score ?? null,
      condition_score: review.condition_score ?? null,
      clubhouse_score: review.clubhouse_score ?? null,
      facilities_score: review.facilities_score ?? null,
      review_date: review.review_date || new Date().toISOString(),
      created_at: review.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      helpful_count: review.helpful_count || 0,
      unhelpful_count: review.unhelpful_count || 0,
      is_mock: false,
      user_profiles: userProfile || null,
      media: [],
      _isOptimistic: true,
    };

    // Detect edit vs new based on whether the user already has a review cached
    const previousUserRatingForSort = snapshot.previousUserRating as { rating?: number } | null;
    const isEdit = !!previousUserRatingForSort;

    const upsertReview = (old: ReviewData[] | undefined) => {
      if (!old) return [optimisticReview];
      // In edit mode, replace in-place to preserve the active sort order
      // (e.g. "Highest rated" / "Most helpful"). New reviews go to the top.
      if (isEdit) {
        const existingIdx = old.findIndex((r: ReviewData) => r.user_id === userId);
        if (existingIdx >= 0) {
          const next = [...old];
          next[existingIdx] = optimisticReview;
          return next;
        }
      }
      const filtered = old.filter((r: ReviewData) => r.user_id !== userId);
      return [optimisticReview, ...filtered];
    };

    // Update reviews list - replace in-place for edits, prepend for new
    queryClient.setQueryData(
      ['course-reviews-full', courseId],
      upsertReview
    );

    // Also update any cached reviews with additional query params (sort, filter, etc.)
    queryClient.setQueriesData(
      { queryKey: ['course-reviews-full', courseId], exact: false },
      (old: ReviewData[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return upsertReview(old);
      }
    );

    // Set user's rating status
    queryClient.setQueryData(
      ['user-course-rating', courseId, userId],
      {
        id: optimisticReview.id,
        rating: optimisticReview.rating,
        review: optimisticReview.review,
        design_score: optimisticReview.design_score,
        condition_score: optimisticReview.condition_score,
        clubhouse_score: optimisticReview.clubhouse_score,
        facilities_score: optimisticReview.facilities_score,
        created_at: optimisticReview.created_at,
        updated_at: optimisticReview.updated_at,
        _isOptimistic: true,
      }
    );

    // Update aggregates
    queryClient.setQueryData(
      ['course-rating-aggregates', courseId],
      (old: CourseRatingAggregate | null | undefined) => {
        if (!old) {
          // First review for this course
          return {
            course_id: courseId,
            avg_overall_score: optimisticReview.rating,
            avg_design_score: optimisticReview.design_score,
            avg_condition_score: optimisticReview.condition_score,
            avg_clubhouse_score: optimisticReview.clubhouse_score,
            avg_facilities_score: optimisticReview.facilities_score,
            review_count: 1,
            text_review_count: optimisticReview.review ? 1 : 0,
            _isOptimistic: true,
          };
        }

        const previousUserRating = snapshot.previousUserRating as { rating?: number } | null;
        const isNewReview = !previousUserRating;
        const oldRating = previousUserRating?.rating || 0;

        if (isNewReview) {
          // New review - increment count and recalculate average
          const newCount = (old.review_count || 0) + 1;
          const totalRating = (old.avg_overall_score || 0) * (old.review_count || 0) + optimisticReview.rating;
          return {
            ...old,
            review_count: newCount,
            text_review_count: (old.text_review_count || 0) + (optimisticReview.review ? 1 : 0),
            avg_overall_score: totalRating / newCount,
            _isOptimistic: true,
          };
        } else {
          // Updated review - adjust average without changing count
          const totalRating = (old.avg_overall_score || 0) * old.review_count - oldRating + optimisticReview.rating;
          return {
            ...old,
            avg_overall_score: totalRating / old.review_count,
            _isOptimistic: true,
          };
        }
      }
    );

    return snapshot;
  }, [queryClient, cancelQueries, takeSnapshot]);

  /**
   * Call BEFORE delete mutation
   */
  const optimisticDeleteReview = useCallback(async (
    courseId: string,
    userId: string
  ): Promise<OptimisticSnapshot> => {
    await cancelQueries(courseId, userId);
    const snapshot = takeSnapshot(courseId, userId);

    // Remove user's review from list
    queryClient.setQueryData(
      ['course-reviews-full', courseId],
      (old: ReviewData[] | undefined) => {
        if (!old) return old;
        return old.filter((r: ReviewData) => r.user_id !== userId);
      }
    );

    // Also update any cached reviews with additional query params
    queryClient.setQueriesData(
      { queryKey: ['course-reviews-full', courseId], exact: false },
      (old: ReviewData[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((r: ReviewData) => r.user_id !== userId);
      }
    );

    // Clear user's rating status
    queryClient.setQueryData(['user-course-rating', courseId, userId], null);

    // Update aggregates (decrement count, recalculate average)
    queryClient.setQueryData(
      ['course-rating-aggregates', courseId],
      (old: CourseRatingAggregate | null | undefined) => {
        if (!old) return old;
        
        const previousUserRating = snapshot.previousUserRating as { rating?: number } | null;
        const oldRating = previousUserRating?.rating || 0;
        const newCount = Math.max(0, (old.review_count || 1) - 1);
        
        if (newCount === 0) {
          return { 
            ...old, 
            review_count: 0, 
            avg_overall_score: 0,
            text_review_count: 0,
            _isOptimistic: true 
          };
        }
        
        const totalRating = (old.avg_overall_score || 0) * old.review_count - oldRating;
        return {
          ...old,
          review_count: newCount,
          avg_overall_score: totalRating / newCount,
          _isOptimistic: true,
        };
      }
    );

    return snapshot;
  }, [queryClient, cancelQueries, takeSnapshot]);

  /**
   * Call on mutation ERROR to restore previous state
   */
  const rollback = useCallback((
    courseId: string,
    userId: string,
    snapshot: OptimisticSnapshot
  ) => {
    // Restore all queries to their previous state
    if (snapshot.previousReviews !== undefined) {
      queryClient.setQueryData(['course-reviews-full', courseId], snapshot.previousReviews);
      // Also restore any partial-matched queries
      queryClient.setQueriesData(
        { queryKey: ['course-reviews-full', courseId], exact: false },
        () => snapshot.previousReviews
      );
    }
    
    if (snapshot.previousUserRating !== undefined) {
      queryClient.setQueryData(['user-course-rating', courseId, userId], snapshot.previousUserRating);
    }
    
    if (snapshot.previousAggregates !== undefined) {
      queryClient.setQueryData(['course-rating-aggregates', courseId], snapshot.previousAggregates);
    }
    
    if (snapshot.previousDistribution !== undefined) {
      queryClient.setQueryData(['course-rating-distribution', courseId], snapshot.previousDistribution);
    }
  }, [queryClient]);

  /**
   * Call on mutation SUCCESS to replace optimistic data with server response
   * and ensure all related queries are fresh
   */
  const confirmUpdate = useCallback((
    courseId: string,
    userId: string
  ) => {
    // Invalidate to fetch fresh server data, replacing optimistic state
    queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId], exact: false });
    queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId, userId] });
    queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
    queryClient.invalidateQueries({ queryKey: ['course-rating-distribution', courseId] });
    queryClient.invalidateQueries({ queryKey: ['club-media', courseId] });
    queryClient.invalidateQueries({ queryKey: ['club-media-paginated', courseId] });
    queryClient.invalidateQueries({ queryKey: ['user-played-course', courseId] });
  }, [queryClient]);

  return {
    optimisticAddReview,
    optimisticDeleteReview,
    rollback,
    confirmUpdate,
  };
}
