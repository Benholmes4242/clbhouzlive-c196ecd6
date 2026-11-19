import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
const h = vi.hoisted(() => ({ reads: [] as string[] }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'author' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  h.reads.push(table);
  const q = { select: () => q, eq: () => q, in: () => q, then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null, data: table === 'course_ratings'
    ? [{ id: 'review', user_id: 'author', course_id: 'course', rating: 9, review: 'Words', created_at: '2026-11-01', design_score: 9, condition_score: 8, clubhouse_score: 7, facilities_score: 6 }]
    : [{ id: 'media', review_id: 'review', media_url: '/media.jpg', media_type: 'image', poster_url: null, created_at: '2026-11-19' }] }).then(resolve) };
  return q;
} } }));
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
afterEach(() => { cleanup(); h.reads.length = 0; });
it('own moments retain review identity, text and all scores from one ratings batch', async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useUserCourseMoments('course'), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(h.reads).toEqual(['course_ratings', 'course_review_media']);
  expect(result.current.data?.[0]).toMatchObject({ id: 'media', reviewId: 'review', reviewInput: {
    reviewId: 'review', rating: 9, text: 'Words', breakdown: { design: 9, conditions: 8, clubhouse: 7, facilities: 6 },
  } });
});