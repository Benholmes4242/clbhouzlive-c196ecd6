import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), select: vi.fn(), inIds: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: h.from } }));

import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';

const courses = () => Array.from({ length: 10 }, (_, i) => ({
  course_id: i === 9 ? 'heritage' : `course-${i + 1}`,
  position: i + 1,
  name: i === 9 ? 'London Club (Heritage)' : `Picked course ${i + 1}`,
  country: 'United Kingdom', sub_country: 'England', region: 'Kent',
  thumbnail_image: null, is_pinned: i < 7, member_score: i < 7 ? 9.5 : 9.0,
}));
const mountHook = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useUserTopTenCourses('ben-owner'), { wrapper });
};

beforeEach(() => {
  h.rpc.mockReset(); h.from.mockReset(); h.select.mockReset(); h.inIds.mockReset();
  h.rpc.mockResolvedValue({ data: { courses: courses().reverse() }, error: null });
  h.inIds.mockResolvedValue({ data: [{ id: 'heritage', global_rank: 45, regional_rank: 20, usa_rank: null }], error: null });
  h.select.mockReturnValue({ in: h.inIds });
  h.from.mockImplementation((table: string) => {
    if (table !== 'golf_courses') throw new Error(`Forbidden client resolver read: ${table}`);
    return { select: h.select };
  });
});

describe('Brief 31 addition: resolved curation read', () => {
  it('returns the ten server positions with Heritage at 10, auto flags and member scores unchanged', async () => {
    const { result } = mountHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.topTen.map(c => c.position)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(result.current.topTen).toHaveLength(10);
    expect(result.current.topTen.slice(0,7).map(c => c.is_pinned)).toEqual([true,true,true,true,true,true,true]);
    expect(result.current.topTen.slice(7).map(c => c.is_pinned)).toEqual([false,false,false]);
    expect(result.current.topTen.map(c => c.rating)).toEqual(courses().map(c => c.member_score));
    expect(result.current.topTen[9]).toEqual({
      id: 'heritage', course_id: 'heritage', position: 10, name: 'London Club (Heritage)',
      country: 'United Kingdom', sub_country: 'England', region: 'Kent', thumbnail_image: null,
      is_pinned: false, rating: 9.0, global_rank: 45, regional_rank: 20, usa_rank: null,
    });
    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(h.rpc).toHaveBeenCalledWith('get_top_ten_block', { p_owner: 'ben-owner' });
    expect(h.from).toHaveBeenCalledTimes(1);
    expect(h.from).toHaveBeenCalledWith('golf_courses');
    expect(h.select).toHaveBeenCalledTimes(1);
    expect(h.select).toHaveBeenCalledWith('id, global_rank, regional_rank, usa_rank');
    expect(h.inIds).toHaveBeenCalledTimes(1);
    expect(h.inIds).toHaveBeenCalledWith('id', courses().reverse().map(c => c.course_id));
  });

  it('preserves a gap at position 4 without compacting the nine returned courses', async () => {
    h.rpc.mockResolvedValue({ data: { courses: courses().filter(c => c.position !== 4).reverse() }, error: null });
    const { result } = mountHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.topTen).toHaveLength(9);
    expect(result.current.topTen.map(c => c.position)).toEqual([1,2,3,5,6,7,8,9,10]);
    expect(result.current.topTen.some(c => c.position === 4)).toBe(false);
    expect(result.current.topTen[8].course_id).toBe('heritage');
  });

  it('returns an empty list for a null block and performs no rank read', async () => {
    h.rpc.mockResolvedValue({ data: null, error: null });
    const { result } = mountHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.topTen).toEqual([]);
    expect(h.from).not.toHaveBeenCalled();
  });

  it('never reads ratings, pinned courses or exclusions to resolve the ten', async () => {
    const { result } = mountHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.topTen[9].course_id).toBe('heritage');
    expect(h.from).not.toHaveBeenCalledWith('course_ratings');
    expect(h.from).not.toHaveBeenCalledWith('user_top_ten_courses');
    expect(h.from).not.toHaveBeenCalledWith('user_top10_exclusions');
    expect(h.from.mock.calls).toEqual([['golf_courses']]);
  });
});