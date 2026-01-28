import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCourseReviews } from '@/hooks/useCourseReviews';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              not: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              })),
            })),
          })),
          lt: vi.fn(() => ({
            not: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          not: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  },
}));

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useCourseReviews', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { 
        queries: { retry: false },
      },
    });
  });

  it('should return empty array when courseId is undefined', async () => {
    const wrapper = createWrapper(queryClient);
    
    const { result } = renderHook(
      () => useCourseReviews(undefined),
      { wrapper }
    );
    
    // Query should not run when courseId is undefined
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should use correct query key with all parameters', async () => {
    const wrapper = createWrapper(queryClient);
    const courseId = 'test-course-id';
    const sortBy = 'highest';
    const ratingFilter = '10-9';
    const filters = { hasText: true };
    
    renderHook(
      () => useCourseReviews(courseId, sortBy, ratingFilter, filters, 'user-id'),
      { wrapper }
    );
    
    // Check that the query was registered with correct key
    const queries = queryClient.getQueryCache().getAll();
    const reviewQuery = queries.find(q => 
      q.queryKey[0] === 'course-reviews-full' && 
      q.queryKey[1] === courseId
    );
    
    expect(reviewQuery).toBeTruthy();
    expect(reviewQuery?.queryKey).toContain('course-reviews-full');
    expect(reviewQuery?.queryKey).toContain(courseId);
    expect(reviewQuery?.queryKey).toContain(sortBy);
    expect(reviewQuery?.queryKey).toContain(ratingFilter);
  });
});
