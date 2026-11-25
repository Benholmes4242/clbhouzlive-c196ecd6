import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

const rows = vi.hoisted(() => ({ media: [] as any[], fail: false }));
vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const filters: Record<string, unknown> = {};
    const b: any = {};
    for (const op of ['select', 'order']) b[op] = () => b;
    b.eq = (k: string, v: unknown) => { filters[k] = [v]; return b; };
    b.in = (k: string, v: unknown[]) => { filters[k] = v; return b; };
    b.then = (r: any, j: any) => {
      if (rows.fail) return Promise.resolve({ data: null, error: new Error('down') }).then(r, j);
      const ids = (filters.review_id as string[]) ?? [];
      const data = table === 'course_review_media' ? rows.media.filter((m) => ids.includes(m.review_id)) : [];
      return Promise.resolve({ data, error: null }).then(r, j);
    };
    return b;
  };
  return { supabase: { from: builder } };
});
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));

import { fetchReviewMedia, fetchReviewMediaBatch, reviewMediaKey } from '@/components/posts/useReviewMedia';
import { tileSourcePages, openTilePhotoSources, type TileSources } from '@/components/courses/browse/tilePhotoViewer';
import { openWithOrigin } from '@/lib/openWithOrigin';

const course = { id: 'c', name: 'Course' };
const m = (id: string, review_id: string, at: string, cover = false) => ({ id, review_id, media_type: 'image', media_url: `https://x/${id}.jpg`, poster_url: null, stream_id: null, is_cover: cover, width: 10, height: 10, created_at: at });
const coursePhoto = (key: string, postId: string, mediaId: string) => ({ kind: 'course' as const, key, postId, mediaId, createdAt: '', imageUrl: `https://x/${mediaId}.jpg`, caption: '', memberName: 'Ann', memberId: 'ann', memberPhoto: null });
const reviewItems = (id: string, n: number) => Array.from({ length: n }, (_, i) => ({ id: `${id}-${i}`, mediaType: 'image' as const, mediaUrl: `https://x/${id}-${i}.jpg`, posterUrl: null, streamId: null, isCover: false, width: 10, height: 10 }));
const sources = (map: Record<string, string>, media: Record<string, number>): TileSources => ({
  reviewOf: new Map(Object.entries(map)), reviews: new Map(),
  media: new Map(Object.entries(media).map(([id, n]) => [id, reviewItems(id, n)])),
});

describe('Brief 20 B — rail tiles open the whole source', () => {
  it('a review with 6 media opens 6 items, landing on the tapped one', () => {
    const row = [coursePhoto('a', 'p1', 'r1-3')];
    const out = tileSourcePages(row, 0, course, [], sources({ p1: 'r1' }, { r1: 6 }))!;
    expect(out.posts).toHaveLength(1);
    expect(out.posts[0].mediaItems).toHaveLength(6);
    expect(out.mediaId).toBe('r1-3');
    expect(out.posts[0].engagementTarget).toEqual({ type: 'review', id: 'r1' });
  });

  it('two photos from one review in a row make one page; vertical order follows the rail', () => {
    const row = [coursePhoto('a', 'p2', 'r2-0'), coursePhoto('b', 'p1', 'r1-1'), coursePhoto('c', 'p1', 'r1-0')];
    const out = tileSourcePages(row, 2, course, [], sources({ p1: 'r1', p2: 'r2' }, { r1: 2, r2: 1 }))!;
    expect(out.posts.map((p) => p.id)).toEqual(['r2', 'r1']);
    expect(out.index).toBe(1);
    expect(out.mediaId).toBe('r1-0');
  });

  it('a failed read falls back to the single tapped item', async () => {
    rows.fail = true;
    const post = { id: 'p1', userId: 'ann', createdAt: '', mediaItems: [{ id: 'pm', type: 'image', imageUrl: 'https://x/pm.jpg' }] } as any;
    const ok = await openTilePhotoSources(new QueryClient(), [coursePhoto('a', 'p1', 'pm')], 0, course, [post]);
    rows.fail = false;
    expect(ok).toBe(true);
    const arg = vi.mocked(openWithOrigin).mock.calls.at(-1)![0] as any;
    expect(arg.posts).toHaveLength(1);
    expect(arg.posts[0].mediaItems.map((i: any) => i.id)).toEqual(['pm']);
  });

  it('fetchReviewMediaBatch seeds every key (empty too) in fetchReviewMedia order', async () => {
    rows.media = [m('a1', 'A', '2026-01-01'), m('a2', 'A', '2026-01-02', true), m('b1', 'B', '2026-01-03')];
    const qc = new QueryClient();
    await fetchReviewMediaBatch(qc, ['A', 'B', 'C']);
    expect(qc.getQueryData(reviewMediaKey('A'))).toEqual(await fetchReviewMedia('A'));
    expect((qc.getQueryData(reviewMediaKey('A')) as any[]).map((x) => x.id)).toEqual(['a2', 'a1']);
    expect(qc.getQueryData(reviewMediaKey('B'))).toEqual(await fetchReviewMedia('B'));
    expect(qc.getQueryData(reviewMediaKey('C'))).toEqual([]);
  });
});
