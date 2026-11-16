// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** Routed mock: user_profiles returns only rows the viewer may see (RLS);
 *  public_profiles returns the public projection. */
const s = vi.hoisted(() => ({
  visible: [] as any[], pub: [] as any[], calls: [] as Array<{ table: string; ids: string[] }>,
  rows: {} as Record<string, any[]>, single: {} as Record<string, any>,
}));
vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    let ids: string[] | null = null;
    const data = () => {
      if (table === 'user_profiles') return s.visible.filter((r) => !ids || ids.includes(r.id));
      if (table === 'public_profiles') return s.pub.filter((r) => !ids || ids.includes(r.id));
      return s.rows[table] ?? [];
    };
    const q: any = {
      select: () => q, eq: () => q, is: () => q, order: () => q, limit: () => q, neq: () => q, or: () => q,
      in: (_c: string, v: string[]) => { if (table.endsWith('profiles')) { ids = v; s.calls.push({ table, ids: v }); } return q; },
      maybeSingle: async () => ({ data: s.single[table] ?? null, error: null }),
      then: (res: any, rej: any) => Promise.resolve({ data: data(), error: null }).then(res, rej),
    };
    return q;
  };
  return { supabase: { from: chain, rpc: vi.fn(async () => ({ data: [], error: null })) } };
});
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' }, session: null, loading: false }) }));
vi.mock('@/hooks/usePushNotifications', () => ({ usePushNotifications: () => ({ isSupported: false, permission: 'default', isSubscribed: false, subscribe: vi.fn(), unsubscribe: vi.fn() }) }));

import { readMemberFaces } from '@/lib/members/readMemberFaces';
import { usePostLikes } from '@/hooks/usePostLikes';
import { useFeedCommentPreview } from '@/hooks/feed/useFeedCommentPreview';
import NotificationsPage from '@/pages/manage/NotificationsPage';

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter><QueryClientProvider client={client()}>{children}</QueryClientProvider></MemoryRouter>
);
const STRANGER = { id: 'stranger', display_name: 'Danny', username: 'danny', profile_photo_url: '/danny.jpg' };

beforeEach(() => {
  s.visible = []; s.pub = []; s.calls = []; s.rows = {}; s.single = {};
});

describe('readMemberFaces', () => {
  it('a visible user_profiles row wins over public_profiles', async () => {
    s.visible = [{ id: 'friend', display_name: 'Friend', username: 'f', profile_photo_url: '/private.jpg' }];
    s.pub = [{ id: 'friend', display_name: 'Other', username: 'o', profile_photo_url: '/other.jpg' }];
    const map = await readMemberFaces(['friend']);
    expect(map.get('friend')?.photoUrl).toBe('/private.jpg');
    expect(s.calls.map((c) => c.table)).toEqual(['user_profiles']);
  });
  it('fills an id missing from user_profiles from public_profiles', async () => {
    s.pub = [STRANGER];
    const map = await readMemberFaces(['stranger']);
    expect(map.get('stranger')).toEqual({ id: 'stranger', displayName: 'Danny', username: 'danny', photoUrl: '/danny.jpg' });
  });
  it('a private, unconnected member stays absent', async () => {
    const map = await readMemberFaces(['private-stranger']);
    expect(map.has('private-stranger')).toBe(false);
  });
  it('batches beyond 100 ids and de-duplicates', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `m${i}`);
    await readMemberFaces([...ids, ...ids.slice(0, 10)]);
    const user = s.calls.filter((c) => c.table === 'user_profiles');
    expect(user.map((c) => c.ids.length)).toEqual([100, 100, 50]);
    expect(s.calls.filter((c) => c.table === 'public_profiles').map((c) => c.ids.length)).toEqual([100, 100, 50]);
  });
  it('empty input makes no request', async () => {
    expect((await readMemberFaces([])).size).toBe(0);
    expect(s.calls).toEqual([]);
  });
});

describe('unconnected public members show their photo', () => {
  it('a comment author', async () => {
    s.pub = [STRANGER];
    s.rows.comments_v2 = [{ id: 'c1', target_id: 'p1', content: 'Nice', created_at: '2026-11-01', user_id: 'stranger', actor_type: 'personal', actor_id: 'stranger' }];
    const { result } = renderHook(() => useFeedCommentPreview(['p1'], 'test'), { wrapper });
    await waitFor(() => expect(result.current.map.get('p1')?.avatar_url).toBe('/danny.jpg'));
  });
  it('a post liker', async () => {
    s.pub = [STRANGER];
    s.rows.editorial_card_likes = [{ user_id: 'stranger' }];
    const { result } = renderHook(() => usePostLikes('card1', true, 'editorial'), { wrapper });
    await waitFor(() => expect(result.current.data?.[0]).toMatchObject({ avatarUrl: '/danny.jpg' }));
  });
  it('a muted notification member', async () => {
    s.pub = [STRANGER];
    s.single.notification_preferences = { muted_types: [], muted_user_ids: ['stranger'], muted_business_ids: [] };
    const { container } = render(<NotificationsPage />, { wrapper });
    await waitFor(() => expect(container.querySelector('img[src="/danny.jpg"]')).not.toBeNull());
    expect(screen.queryByText('Unavailable account')).toBeNull();
  });
});
