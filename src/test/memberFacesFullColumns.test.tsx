// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** user_profiles = RLS-visible rows; public_profiles = public projection.
 *  select() strings are honoured, so absent columns stay absent. */
const s = vi.hoisted(() => ({
  visible: [] as any[], pub: [] as any[], rows: {} as Record<string, any[]>, single: {} as Record<string, any>,
  selects: [] as Array<{ table: string; cols: string }>,
}));
vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    let ids: string[] | null = null; let cols = '*'; let eqId: string | null = null;
    const pick = (r: any) => cols === '*' ? r : Object.fromEntries(cols.split(',').map((c) => c.trim()).filter((c) => c in r).map((c) => [c, r[c]]));
    const data = () => {
      const src = table === 'user_profiles' ? s.visible : table === 'public_profiles' ? s.pub : (s.rows[table] ?? []);
      return src.filter((r) => (!ids || ids.includes(r.id)) && (!eqId || r.id === eqId)).map(pick);
    };
    const q: any = {
      select: (c?: string) => { cols = (c ?? '*').replace(/\s+/g, ' '); s.selects.push({ table, cols }); return q; },
      eq: (c: string, v: string) => { if (c === 'id' && table !== 'posts') eqId = v; return q; },
      is: () => q, order: () => q, limit: () => q, neq: () => q, or: () => q,
      in: (_c: string, v: string[]) => { ids = v; return q; },
      maybeSingle: async () => ({ data: s.single[table] ?? data()[0] ?? null, error: null }),
      then: (res: any, rej: any) => Promise.resolve({ data: data(), error: null }).then(res, rej),
    };
    return q;
  };
  return { supabase: { from: chain, rpc: vi.fn(async () => ({ data: [], error: null })) } };
});
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: (ids: (string | null | undefined)[]) => ({ members: new Map(ids.filter((id) => id === 'pro').map((id) => [id, { user_id: id, pro_kind: 'tour_pro' }])), isLoading: false }) }));
vi.mock('@/features/pro-verification/proMembersCache', () => ({ cachedProMember: () => null }));
vi.mock('@/features/amateur-ranking/useAmateurMembers', () => ({ useAmateurMembers: () => ({ members: new Set(), isLoading: false }) }));

import { fillMissingFaces } from '@/lib/members/readMemberFaces';
import { usePostLikes } from '@/hooks/usePostLikes';
import { useBusinessTeam } from '@/hooks/useBusinessTeam';
import { useCommentsSubject } from '@/features/comments-v2/hooks/useCommentsContext';
import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';

const wrap = () => { const c = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>; };
beforeEach(() => { s.visible = []; s.pub = []; s.rows = {}; s.single = {}; s.selects = []; });
afterEach(cleanup);

const pubPro = { id: 'pro', display_name: 'Pat Pro', username: 'patpro', profile_photo_url: 'https://x/pat.jpg', is_verified: true, first_name: 'Pat', home_club: 'Royal X', handicap_visibility: 'public' };

describe('FIX_MEMBER_FACES_FULL_COLUMNS', () => {
  it('fillMissingFaces carries requested projection columns and ignores one the projection lacks', async () => {
    s.pub = [pubPro];
    const rows = await fillMissingFaces<any>([], ['pro'], ['is_verified', 'first_name', 'home_club', 'handicap_visibility']);
    expect(rows[0]).toMatchObject({ id: 'pro', is_verified: true, first_name: 'Pat', home_club: 'Royal X' });
    expect('handicap_visibility' in rows[0]).toBe(false);
    const sel = s.selects.find((x) => x.table === 'public_profiles')!.cols;
    expect(sel).not.toContain('handicap_visibility');
  });

  it('a verified public unconnected pro filled on a likes row still renders PRO', async () => {
    s.rows.post_likes = [{ user_id: 'pro', actor_type: 'personal', actor_id: 'pro' }];
    s.pub = [pubPro];
    const { result } = renderHook(() => usePostLikes('post-1', true), { wrapper: wrap() });
    await waitFor(() => expect(result.current.data?.length).toBe(1));
    const liker = result.current.data![0];
    expect(liker.avatarUrl).toBe('https://x/pat.jpg');
    const { container } = render(<ProOrVerifiedMark userId={liker.actorId ?? liker.userId} name={liker.displayName} />);
    expect(container.querySelectorAll('.pro-label:not([data-kind="am"])').length).toBe(1);
  });

  it('business team: a member whose embed is null shows their public name and photo', async () => {
    s.rows.business_members = [{ id: 'm1', user_profile_id: 'u2', role: 'staff', created_at: '', is_public: true, job_title: null, user_profile: null }];
    s.pub = [{ id: 'u2', display_name: 'Uma', username: 'uma', profile_photo_url: 'https://x/u.jpg' }];
    const { result } = renderHook(() => useBusinessTeam('b1'), { wrapper: wrap() });
    await waitFor(() => expect(result.current.data?.[0]?.user_profile).toBeTruthy());
    expect(result.current.data![0].user_profile).toMatchObject({ display_name: 'Uma', profile_photo_url: 'https://x/u.jpg' });
  });

  it('comments context: an unconnected public post author name resolves', async () => {
    s.single.posts = { user_id: 'u3', actor_type: 'personal', actor_id: 'u3', course_id: null, whs_score_id: null, source_review_id: null };
    s.pub = [{ id: 'u3', display_name: 'Ned Public', username: 'ned', profile_photo_url: null }];
    const { result } = renderHook(() => useCommentsSubject('post', 'p1', true), { wrapper: wrap() });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.data!.authorName).toBe('Ned Public');
  });
});
