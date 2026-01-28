import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useOptimisticReviewUpdate } from '@/hooks/useOptimisticReviewUpdate';

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useOptimisticReviewUpdate', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { 
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('optimisticAddReview', () => {
    it('should add review to cache immediately', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      const review = { rating: 8.5, review: 'Great course!' };
      
      await act(async () => {
        await result.current.optimisticAddReview(courseId, userId, review);
      });
      
      const cachedReviews = queryClient.getQueryData(['course-reviews-full', courseId]) as any[];
      expect(cachedReviews).toHaveLength(1);
      expect(cachedReviews[0].rating).toBe(8.5);
      expect(cachedReviews[0]._isOptimistic).toBe(true);
    });

    it('should update user rating status', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      const review = { rating: 9.0, review: 'Amazing!' };
      
      await act(async () => {
        await result.current.optimisticAddReview(courseId, userId, review);
      });
      
      const userRating = queryClient.getQueryData(['user-course-rating', courseId, userId]) as any;
      expect(userRating).toBeTruthy();
      expect(userRating.rating).toBe(9.0);
      expect(userRating._isOptimistic).toBe(true);
    });

    it('should update aggregates correctly for new review', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      
      // Set up existing aggregates
      queryClient.setQueryData(['course-rating-aggregates', courseId], {
        course_id: courseId,
        avg_overall_score: 8.0,
        review_count: 10,
        text_review_count: 8,
      });
      
      await act(async () => {
        await result.current.optimisticAddReview(courseId, userId, { rating: 10.0, review: 'Perfect!' });
      });
      
      const aggregates = queryClient.getQueryData(['course-rating-aggregates', courseId]) as any;
      expect(aggregates.review_count).toBe(11);
      // (8.0 * 10 + 10.0) / 11 = 90 / 11 ≈ 8.18
      expect(aggregates.avg_overall_score).toBeCloseTo(8.18, 1);
    });

    it('should replace existing user review (edit scenario)', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      
      // Set up existing user rating
      queryClient.setQueryData(['user-course-rating', courseId, userId], {
        id: 'existing-rating-id',
        rating: 7.0,
      });
      
      // Set up existing reviews list with user's review
      queryClient.setQueryData(['course-reviews-full', courseId], [
        { id: 'existing-rating-id', user_id: userId, rating: 7.0 },
        { id: 'other-review', user_id: 'other-user', rating: 8.0 },
      ]);
      
      await act(async () => {
        await result.current.optimisticAddReview(courseId, userId, { rating: 9.0 });
      });
      
      const cachedReviews = queryClient.getQueryData(['course-reviews-full', courseId]) as any[];
      // Should still have 2 reviews (user's updated + other)
      expect(cachedReviews).toHaveLength(2);
      // User's review should be at top with new rating
      expect(cachedReviews[0].user_id).toBe(userId);
      expect(cachedReviews[0].rating).toBe(9.0);
    });
  });

  describe('optimisticDeleteReview', () => {
    it('should remove review from cache immediately', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      
      // Set up existing reviews
      queryClient.setQueryData(['course-reviews-full', courseId], [
        { id: 'user-review', user_id: userId, rating: 8.0 },
        { id: 'other-review', user_id: 'other-user', rating: 7.0 },
      ]);
      
      await act(async () => {
        await result.current.optimisticDeleteReview(courseId, userId);
      });
      
      const cachedReviews = queryClient.getQueryData(['course-reviews-full', courseId]) as any[];
      expect(cachedReviews).toHaveLength(1);
      expect(cachedReviews[0].user_id).toBe('other-user');
    });

    it('should clear user rating status', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      
      // Set up existing user rating
      queryClient.setQueryData(['user-course-rating', courseId, userId], {
        id: 'rating-id',
        rating: 8.0,
      });
      
      await act(async () => {
        await result.current.optimisticDeleteReview(courseId, userId);
      });
      
      const userRating = queryClient.getQueryData(['user-course-rating', courseId, userId]);
      expect(userRating).toBeNull();
    });

    it('should decrement aggregates correctly', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      
      // Set up existing user rating (for accurate average calculation)
      queryClient.setQueryData(['user-course-rating', courseId, userId], {
        rating: 10.0,
      });
      
      // Set up aggregates
      queryClient.setQueryData(['course-rating-aggregates', courseId], {
        course_id: courseId,
        avg_overall_score: 9.0,
        review_count: 10,
      });
      
      await act(async () => {
        await result.current.optimisticDeleteReview(courseId, userId);
      });
      
      const aggregates = queryClient.getQueryData(['course-rating-aggregates', courseId]) as any;
      expect(aggregates.review_count).toBe(9);
      // (9.0 * 10 - 10.0) / 9 = 80 / 9 ≈ 8.89
      expect(aggregates.avg_overall_score).toBeCloseTo(8.89, 1);
    });
  });

  describe('rollback', () => {
    it('should restore previous state on error', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      
      // Set up initial state
      const originalReviews = [{ id: 'original', user_id: 'other', rating: 7.0 }];
      const originalAggregates = { review_count: 1, avg_overall_score: 7.0 };
      
      queryClient.setQueryData(['course-reviews-full', courseId], originalReviews);
      queryClient.setQueryData(['course-rating-aggregates', courseId], originalAggregates);
      
      let snapshot: any;
      
      await act(async () => {
        // Apply optimistic update
        snapshot = await result.current.optimisticAddReview(courseId, userId, { rating: 10.0 });
      });
      
      // Verify optimistic update was applied
      let reviews = queryClient.getQueryData(['course-reviews-full', courseId]) as any[];
      expect(reviews).toHaveLength(2);
      
      // Rollback
      act(() => {
        result.current.rollback(courseId, userId, snapshot);
      });
      
      // Verify rollback restored original state
      reviews = queryClient.getQueryData(['course-reviews-full', courseId]) as any[];
      expect(reviews).toHaveLength(1);
      expect(reviews[0].id).toBe('original');
      
      const aggregates = queryClient.getQueryData(['course-rating-aggregates', courseId]) as any;
      expect(aggregates.review_count).toBe(1);
    });
  });

  describe('confirmUpdate', () => {
    it('should invalidate all related queries', async () => {
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useOptimisticReviewUpdate(), { wrapper });
      
      const courseId = 'course-123';
      const userId = 'user-456';
      
      // Set up some cached data
      queryClient.setQueryData(['course-reviews-full', courseId], []);
      queryClient.setQueryData(['user-course-rating', courseId, userId], null);
      
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      act(() => {
        result.current.confirmUpdate(courseId, userId);
      });
      
      // Should invalidate reviews, user rating, aggregates, distribution, and media
      expect(invalidateSpy).toHaveBeenCalledTimes(5);
    });
  });
});
