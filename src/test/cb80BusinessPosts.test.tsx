import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, renderHook, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({
  tables: {} as Record<string, unknown>,
  error: vi.fn(), success: vi.fn(), invoke: vi.fn(),
  session: { user: { id: 'viewer' } } as { user: { id: string } | null },
}));

/**
 * Thenable query-chain stub. A table result is either a plain PostgREST-style
 * result ({ data, error }) used for every terminal, or { maybe, list } when a
 * flow hits the same table through maybeSingle (lookup) and an awaited
 * update/delete .select('id') (the write) with different outcomes.
 */
function chainable(result: any) {
  const c: any = {};
  let mode = 'read';
  for (const m of ['select', 'eq', 'in', 'or', 'order', 'insert', 'limit', 'range']) c[m] = () => c;
  c.update = () => { mode = 'update'; return c; };
  c.delete = () => { mode = 'delete'; return c; };
  const resolve = () => (typeof result === 'function' ? result(mode) : result);
  const split = () => {
    const r = resolve();
    return r && typeof r === 'object' && ('maybe' in r || 'list' in r);
  };
  c.maybeSingle = async () => (split() ? resolve().maybe : resolve());
  c.single = async () => (split() ? resolve().maybe : resolve());
  c.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(split() ? resolve().list : resolve()).then(res, rej);
  return c;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => chainable(f.tables[table] ?? { data: null, error: null }),
    auth: { getUser: async () => ({ data: { user: null } }) },
    functions: { invoke: f.invoke },
  },
}));
vi.mock('@/lib/toast', () => ({ toast: { error: f.error, success: f.success, info: vi.fn() } }));
vi.mock('@/utils/toast', () => ({ showToast: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ session: f.session, loading: false }) }));
vi.mock('@/lib/mentions/syncMentions', () => ({ syncMentionsForContent: vi.fn() }));
vi.mock('@/lib/logger', () => ({ AppLog: { debug: vi.fn(), error: vi.fn() } }));

import { canManagePost, POST_CHANGE_REFUSED } from '@/lib/canManagePost';
import { useEditablePost } from '@/hooks/useEditablePost';
import { useUpdatePost } from '@/hooks/useUpdatePost';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { updateScheduledPost, reschedulePost } from '@/services/posts/scheduledPosts';
import ScheduledPostsSheetV2 from '@/features/post-v2/components/ScheduledPostsSheetV2';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

const bizPost = { id: 'p1', user_id: 'author', content: 'x', visibility: 'anyone', actor_type: 'business', actor_id: 'biz', source_review_id: null };

beforeEach(() => {
  vi.clearAllMocks();
  f.tables = {};
  f.session = { user: { id: 'viewer' } };
});
afterEach(cleanup);

describe('CB80 canManagePost rule', () => {
  const manageable = new Set<string>();
  const team = new Set<string>(['biz']);
  it('author still an editor of the business → true', () => {
    expect(canManagePost({ userId: 'me', actorType: 'business', actorId: 'biz' }, 'me', manageable, team)).toBe(true);
  });
  it('author no longer on the team → false', () => {
    expect(canManagePost({ userId: 'me', actorType: 'business', actorId: 'biz' }, 'me', manageable, new Set())).toBe(false);
  });
  it('another member who is owner/admin → true', () => {
    expect(canManagePost({ userId: 'author', actorType: 'business', actorId: 'biz' }, 'me', new Set(['biz']), new Set(['biz']))).toBe(true);
  });
  it('another member who is only an editor → false', () => {
    expect(canManagePost({ userId: 'author', actorType: 'business', actorId: 'biz' }, 'me', manageable, team)).toBe(false);
  });
  it('personal post unchanged: author true, anyone else false', () => {
    expect(canManagePost({ userId: 'me', actorType: 'personal', actorId: 'me' }, 'me', manageable, team)).toBe(true);
    expect(canManagePost({ userId: 'author', actorType: 'personal', actorId: 'author' }, 'me', manageable, team)).toBe(false);
  });
});

describe('CB80 useEditablePost canManage', () => {
  function setup(membership: { role: string } | null, post: Record<string, unknown> = bizPost) {
    f.tables = {
      posts: { data: post, error: null },
      business_members: { data: membership, error: null },
      post_media: { data: [], error: null },
      post_courses: { data: [], error: null },
    };
  }
  async function resolve() {
    const { result } = renderHook(() => useEditablePost('p1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    return result.current.data;
  }
  it('author still an editor → canManage true', async () => {
    f.session = { user: { id: 'author' } };
    setup({ role: 'editor' });
    expect((await resolve())?.canManage).toBe(true);
  });
  it('author no longer on the team → blocked', async () => {
    f.session = { user: { id: 'author' } };
    setup(null);
    const data = await resolve();
    expect(data?.canManage).toBe(false);
    expect(data?.blockedReason).toBe('not-owner');
  });
  it('another member who is owner/admin → canManage true', async () => {
    setup({ role: 'admin' });
    expect((await resolve())?.canManage).toBe(true);
  });
  it('another member who is only an editor → blocked', async () => {
    setup({ role: 'editor' });
    expect((await resolve())?.canManage).toBe(false);
  });
  it('personal post unchanged: the author manages it with no membership read', async () => {
    f.session = { user: { id: 'author' } };
    setup(null, { ...bizPost, actor_type: 'personal', actor_id: 'author' });
    expect((await resolve())?.canManage).toBe(true);
  });
});

describe('CB80 zero-row writes fail loudly', () => {
  it('useUpdatePost: 0 rows → refusal toast, not success; 1 row → success', async () => {
    f.tables = { posts: { data: [], error: null }, post_courses: { data: [], error: null } };
    const { result } = renderHook(() => useUpdatePost(), { wrapper });
    const input = { postId: 'p1', caption: 'new', visibility: 'anyone' as const, courseIds: [], keptMedia: [], removedMediaIds: [] };
    const refused = await result.current.updatePost(input);
    expect(refused.success).toBe(false);
    expect(f.error).toHaveBeenCalledWith("Couldn't update post", expect.objectContaining({ description: POST_CHANGE_REFUSED }));

    f.error.mockClear();
    f.tables.posts = { data: [{ id: 'p1' }], error: null };
    const ok = await result.current.updatePost(input);
    expect(ok.success).toBe(true);
    expect(f.error).not.toHaveBeenCalled();
  });

  it('usePostDeletion: 0 rows → refusal toast and no invalidation; 1 row → success', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const w = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => usePostDeletion(), { wrapper: w });

    f.tables = {
      posts: { maybe: { data: { id: 'p1', source_review_id: null }, error: null }, list: { data: [], error: null } },
      post_media: { data: [], error: null },
    };
    const refused = await result.current.deletePost('p1');
    expect(refused.success).toBe(false);
    expect(f.error).toHaveBeenCalledWith('Delete failed', expect.objectContaining({ description: POST_CHANGE_REFUSED }));
    expect(invalidate).not.toHaveBeenCalled();

    f.error.mockClear();
    f.tables.posts = { maybe: { data: { id: 'p1', source_review_id: null }, error: null }, list: { data: [{ id: 'p1' }], error: null } };
    const ok = await result.current.deletePost('p1');
    expect(ok.success).toBe(true);
  });
});

describe('CB80 scheduled posts service', () => {
  it('updateScheduledPost: 0 rows → throws the refusal; 1 row → true', async () => {
    f.tables = { posts: { data: [], error: null } };
    await expect(updateScheduledPost('p1', { content: 'x' })).rejects.toThrow(POST_CHANGE_REFUSED);
    f.tables.posts = { data: [{ id: 'p1' }], error: null };
    await expect(updateScheduledPost('p1', { content: 'x' })).resolves.toBe(true);
  });
  it('reschedulePost: 0 rows → throws the refusal; 1 row → true', async () => {
    f.tables = { posts: { data: [], error: null } };
    await expect(reschedulePost('p1', new Date())).rejects.toThrow(POST_CHANGE_REFUSED);
    f.tables.posts = { data: [{ id: 'p1' }], error: null };
    await expect(reschedulePost('p1', new Date())).resolves.toBe(true);
  });
});

describe('CB80 scheduled posts sheet', () => {
  const scheduledRow = { id: 'p1', content: 'Tee time', scheduled_at: '2026-10-30T09:00:00Z', actor_type: 'personal' };
  it('cancel with 0 rows toasts the refusal and keeps the row', async () => {
    f.tables = { posts: { data: [scheduledRow], error: null } };
    render(<ScheduledPostsSheetV2 open onClose={() => {}} userId="viewer" />);
    expect(await screen.findByText('Tee time')).toBeTruthy();
    // The delete now affects 0 rows (RLS refusal); the row must stay put.
    f.tables.posts = { data: [], error: null };
    fireEvent.click(screen.getByLabelText('Cancel'));
    fireEvent.click(screen.getByText('Yes'));
    await waitFor(() => expect(f.error).toHaveBeenCalledWith(POST_CHANGE_REFUSED));
    expect(screen.getByText('Tee time')).toBeTruthy();
  });
  it('cancel with 1 row removes it as before', async () => {
    let deleted = false;
    f.tables = {
      posts: (mode: string) =>
        mode === 'delete'
          ? (deleted = true, { data: [{ id: 'p1' }], error: null })
          : { data: deleted ? [] : [scheduledRow], error: null },
    };
    render(<ScheduledPostsSheetV2 open onClose={() => {}} userId="viewer" />);
    expect(await screen.findByText('Tee time')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Cancel'));
    fireEvent.click(screen.getByText('Yes'));
    await waitFor(() => expect(screen.queryByText('Tee time')).toBeNull());
    expect(f.error).not.toHaveBeenCalled();
  });
});
