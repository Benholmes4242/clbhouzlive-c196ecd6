import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: h.from, rpc: h.rpc } }));

import { postAuthor } from '@/lib/postAuthor';
import { mapPublishedPost } from '@/lib/publishedPostViewer';
import { useDiscoverMediaPreview } from '@/components/explore-tab-new/courseled/hooks/useDiscoverMediaPreview';
import { memberShotToHubRow, type MemberShotRow } from '@/lib/courseMedia/memberShotPosts';

afterEach(() => { cleanup(); h.from.mockReset(); h.rpc.mockReset(); });

/** Fluent supabase table mock: from(table) → select/eq/in/order/limit/maybeSingle. */
function mockTables(tables: Record<string, { data: unknown; error?: unknown }>) {
  h.from.mockImplementation((table: string) => {
    const result = tables[table] ?? { data: [], error: null };
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: (v: unknown) => void) => resolve(result),
    };
    return chain;
  });
}

describe('postAuthor — business never falls back to the uploader', () => {
  it('returns the business name, a NULL avatar and a null handle when the business has no logo', () => {
    const author = postAuthor({
      actor_type: 'business',
      actor_id: 'b1',
      business_name: 'Machrihanish Golf Club',
      business_logo_url: null,
      creator_display_name: 'machgolfclub',
      creator_avatar_url: 'https://me',
    });
    expect(author.kind).toBe('business');
    expect(author.name).toBe('Machrihanish Golf Club');
    expect(author.avatarUrl).toBeNull();
    expect(author.handle).toBeNull();
  });
});

describe('mapPublishedPost — shared links open as the business', () => {
  const row = {
    id: 'p1',
    content: 'When Robert McIntyre came to play!',
    post_type: 'post',
    created_at: '2026-11-01T00:00:00Z',
    user_id: 'uploader-1',
    actor_type: 'business',
    actor_id: 'b1',
    status: 'published',
    course_id: null,
    source_review_id: null,
    whs_score_id: null,
    like_count: 0,
    comment_count: 0,
    user_profiles: { id: 'uploader-1', username: 'machgolfclub', display_name: 'Mac Heed', profile_photo_url: 'https://me', is_verified: false },
    golf_courses: null,
    course_ratings: null,
    post_media: [],
  };
  const viewer = { userId: undefined, actorId: null, actorType: 'personal' as const };

  it('overrides the mapped identity with the business_accounts row', async () => {
    mockTables({
      business_accounts: { data: { id: 'b1', name: 'Machrihanish Golf Club', logo_url: 'https://logo', is_verified: true, slug: null } },
    });
    const post = await mapPublishedPost(row, viewer);
    expect(post.actorType).toBe('business');
    expect(post.actorId).toBe('b1');
    expect(post.displayName).toBe('Machrihanish Golf Club');
    expect(post.avatarUrl).toBe('https://logo');
    expect(post.username).toBe('');
    expect(post.isVerified).toBe(true);
    expect(post.userId).toBe('uploader-1');
  });

  it('keeps actorType business with an EMPTY name when the business fetch returns null — never the uploader', async () => {
    mockTables({ business_accounts: { data: null } });
    const post = await mapPublishedPost(row, viewer);
    expect(post.actorType).toBe('business');
    expect(post.actorId).toBe('b1');
    expect(post.displayName).toBe('');
    expect(post.displayName).not.toBe('machgolfclub');
    expect(post.avatarUrl).toBe('');
  });
});

describe('useDiscoverMediaPreview — gallery previews name the business', () => {
  it('maps a business row to the business name and logo, not the uploader profile', async () => {
    mockTables({
      posts: {
        data: [{
          id: 'p1', user_id: 'uploader-1', actor_id: 'b1', actor_type: 'business',
          content: 'A day on the links', created_at: '2026-11-01T00:00:00Z',
          course_id: null, tagged_course_ids: null, whs_score_id: null,
          like_count: 0, comment_count: 0,
          post_media: [{ id: 'm1', media_type: 'video', media_url: 'https://shot', poster_url: null, hls_url: null, stream_id: null, width: 1080, height: 1080, duration_seconds: null, display_order: 0 }],
        }],
      },
      public_profiles: { data: [{ id: 'uploader-1', username: 'machgolfclub', display_name: 'Mac Heed', profile_photo_url: 'https://me' }] },
      golf_courses: { data: [] },
      business_accounts: { data: [{ id: 'b1', name: 'Machrihanish Golf Club', logo_url: 'https://logo', is_verified: true }] },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useDiscoverMediaPreview(true), { wrapper });
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    const item = hook.result.current.data!.clips[0];
    expect(item.displayName).toBe('Machrihanish Golf Club');
    expect(item.avatarUrl).toBe('https://logo');
    expect(item.post.actorType).toBe('business');
    expect(item.post.username).toBe('');
  });
});

describe('memberShotPosts — hole credits carry the business actor', () => {
  const baseRow: MemberShotRow = {
    id: 'm1', course_id: 'c1', media_type: 'image', media_url: 'https://shot',
    member_id: 'uploader-1', member_name: 'Machrihanish Golf Club', member_avatar_url: 'https://logo',
    hole_no: 1,
  };

  it('a business credit row becomes post_actor_type business with the business actor id and name', () => {
    const hub = memberShotToHubRow({ ...baseRow, credit_actor_type: 'business', credit_actor_id: 'b1', credit_is_verified: true }, 'Machrihanish Golf Club');
    expect(hub.post_actor_type).toBe('business');
    expect(hub.post_actor_id).toBe('b1');
    expect(hub.business_name).toBe('Machrihanish Golf Club');
    expect(hub.business_logo_url).toBe('https://logo');
    expect(hub.business_is_verified).toBe(true);
    expect(hub.post_user_id).toBe('uploader-1');
  });

  it('a personal row is unchanged', () => {
    const hub = memberShotToHubRow({ ...baseRow, member_name: 'Mac Heed' }, 'Machrihanish Golf Club');
    expect(hub.post_actor_type).toBe('personal');
    expect(hub.post_actor_id).toBe('uploader-1');
    expect(hub.business_name).toBeUndefined();
  });
});
