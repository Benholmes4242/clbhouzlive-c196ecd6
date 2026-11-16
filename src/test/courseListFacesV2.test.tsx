// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ rpc: vi.fn(), profiles: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: f.rpc,
  from: () => ({ select: () => ({ in: (_key: string, ids: string[]) => f.profiles(ids) }) }),
} }));
import { useCourseRecordHolders } from '@/components/courses/useCourseRecordHolders';
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks();
  f.rpc.mockImplementation((name: string) => Promise.resolve({ error: null, data: name === 'get_course_record_holders'
    ? [{ course_id: 'one', holder_id: 'holder', holder_name: 'Ada', record_gross: 63 }]
    : [{ course_id: 'one', player_ids: ['player', 'holder', 'deleted'] }] }));
  f.profiles.mockImplementation(() => Promise.resolve({ error: null, data: [
    { id: 'holder', display_name: 'Ada', profile_photo_url: '/ada.jpg' },
    { id: 'player', display_name: 'Bo', profile_photo_url: null },
  ] }));
});
describe('Course list V2 batched faces', () => {
  it('resolves players and holder in one profile read, preserving server face order', async () => {
    const { result } = renderHook(() => useCourseRecordHolders(['one', 'one']), { wrapper });
    await waitFor(() => expect(result.current.map.get('one')?.photoUrl).toBe('/ada.jpg'));
    expect(f.rpc).toHaveBeenCalledWith('get_post_course_context', { p_course_ids: ['one'] });
    expect(f.profiles).toHaveBeenCalledTimes(1);
    expect(new Set(f.profiles.mock.calls[0][0])).toEqual(new Set(['holder', 'player', 'deleted']));
    expect(result.current.players?.get('one')?.map(p => p.id)).toEqual(['player', 'holder']);
  });
  it('Top 100 opts out of a second player-context read', async () => {
    const { result } = renderHook(() => useCourseRecordHolders(['one'], { includePlayers: false }), { wrapper });
    await waitFor(() => expect(result.current.map.get('one')?.holderId).toBe('holder'));
    expect(f.rpc.mock.calls.map(call => call[0])).toEqual(['get_course_record_holders']);
    expect(f.profiles.mock.calls[0][0]).toEqual(['holder']);
  });
  it('empty lists make no requests', () => {
    renderHook(() => useCourseRecordHolders([]), { wrapper });
    expect(f.rpc).not.toHaveBeenCalled();
    expect(f.profiles).not.toHaveBeenCalled();
  });
});