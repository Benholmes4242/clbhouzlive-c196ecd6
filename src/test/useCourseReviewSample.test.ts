import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCourseReviewSample } from '@/hooks/useCourseReviewSample';

const { range, eq, select, order, not } = vi.hoisted(() => ({
  range: vi.fn(), eq: vi.fn(), select: vi.fn(), order: vi.fn(), not: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select }) } }));
beforeEach(() => {
  vi.clearAllMocks();
  const chain = { eq, select, order, not, range };
  for (const fn of [eq, select, order, not]) fn.mockReturnValue(chain);
});
describe('complete Reviews sample', () => {
  it('reads beyond prose cap with stable pagination and excludes mocks', async () => {
    const first = Array.from({ length: 500 }, (_, i) => ({ id: String(i) }));
    range.mockResolvedValueOnce({ data: first, error: null }).mockResolvedValueOnce({ data: [{ id: 'last' }], error: null });
    expect(await fetchCourseReviewSample('course')).toHaveLength(501);
    expect(range.mock.calls).toEqual([[0, 499], [500, 999]]);
    expect(eq).toHaveBeenCalledWith('is_mock', false);
    expect(order).toHaveBeenCalledWith('id', { ascending: true });
  });
  it('does not present partial sample when a later page fails', async () => {
    range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, () => ({ id: 'row' })), error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('sample unavailable') });
    await expect(fetchCourseReviewSample('course')).rejects.toThrow('sample unavailable');
  });
});