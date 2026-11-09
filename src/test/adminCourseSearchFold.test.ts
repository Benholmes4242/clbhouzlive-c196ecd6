import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
const calls: { method: string; args: unknown[] }[] = [];
const from = vi.fn();

function builder(result: unknown) {
  const b: any = {};
  for (const m of ['select', 'or', 'in', 'eq', 'is', 'order', 'range']) {
    b[m] = (...args: unknown[]) => { calls.push({ method: m, args }); return b; };
  }
  b.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return b;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => from(...a) },
}));

import { fetchCourses } from '@/features/admin/hooks/useCourses';

beforeEach(() => {
  rpc.mockReset(); from.mockReset(); calls.length = 0;
  from.mockImplementation(() => builder({ data: [], error: null, count: 0 }));
});

describe('admin course search uses search_course_ids', () => {
  it('calls the RPC with the trimmed term and applies .in(id, ids)', async () => {
    rpc.mockResolvedValue({ data: ['a', 'b'], error: null });
    await fetchCourses('  Golfclub kon ', 'all', 'all', 1, 50);
    expect(rpc).toHaveBeenCalledWith('search_course_ids', { p_query: 'Golfclub kon', p_limit: 200 });
    expect(calls.find(c => c.method === 'in')?.args).toEqual(['id', ['a', 'b']]);
    expect(calls.some(c => c.method === 'or')).toBe(false);
  });

  it('returns empty without querying courses when no ids match', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const r = await fetchCourses('zzz', 'all', 'all', 1, 50);
    expect(r).toEqual({ courses: [], total: 0 });
    expect(from).not.toHaveBeenCalled();
  });

  it('does not call the RPC for an empty term', async () => {
    await fetchCourses('   ', 'all', 'all', 1, 50);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith('golf_courses');
  });
});
