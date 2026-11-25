/**
 * What's been played tile photo taps (BRIEF_WHATS_BEEN_PLAYED_V4 §3): a photo
 * opens the canonical full-screen viewer, never the course page: one sideways
 * page of the whole row (amendment), landing on the tapped photo.
 * - Hole photos: the hole's get_hole_media rows (holeMediaQuery) mapped by
 *   holeShotsToFeedPosts, the hole-walk path useCourseGallery uses.
 * - Course photos: the course's get_course_media_v2 set (galleryCourseMediaQuery)
 *   mapped by coursePostsToShotPosts, as Latest from the courses opens it.
 * Opened from the rail sheet, the viewer takes VIEWER_ABOVE_SHEETS_Z so it
 * clears the sheet (zLayers: ranking follows who opened whom).
 *
 * BRIEF 20 B: one viewer page PER SOURCE in rail order. A review-sourced photo
 * opens its review's full set (reviewFeedPost, as ReviewBottomSheet builds it,
 * from the seeded review-media cache). A non-review post uses only what the
 * tile already holds (loaded course/hole rows), so its media outside those sets
 * is not shown. Sourceless photos keep the synthetic row page. Reads: one posts
 * read, one course_ratings read, one course_review_media read — prefetched on
 * render; a tap awaits them ≤800ms, and on failure opens today's single item.
 */
import type { QueryClient } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import { supabase } from '@/integrations/supabase/client';
import { fetchReviewMediaBatch, type ReviewMediaItem } from '@/components/posts/useReviewMedia';
import { reviewFeedPost } from '@/lib/reviews/reviewFeedPost';
import { coursePostsToShotPosts, holeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { VIEWER_ABOVE_SHEETS_Z } from '@/lib/zLayers';
import type { TileCoursePhoto, TileHolePhoto } from './usePlayedTile';

export const PLAYED_VIEWER_ORIGIN = 'courses-whats-played';

type TilePhoto = TileHolePhoto | TileCoursePhoto;

/** The one viewer item for a tile photo, from rows the tile already loaded. */
function photoItem(photo: TilePhoto, course: { id: string; name: string }, coursePosts: readonly FeedPost[]) {
  if (photo.kind === 'hole') {
    const rows = (photo.rows ?? []).filter((r) => r.id === photo.mediaId);
    return holeShotsToFeedPosts(rows, course.name, course.id, photo.holeNo)[0]?.mediaItems[0] ?? null;
  }
  const source = coursePosts.filter((p) => p.id === photo.postId);
  const items = coursePostsToShotPosts(source, course.id, course.name)[0]?.mediaItems ?? [];
  return items.find((i) => i.id === photo.mediaId) ?? items[0] ?? null;
}

/**
 * AMENDMENT to V4 §3: ONE synthetic page for the course holding every photo in
 * the tile's row, in row order, as a single sideways carousel landing on the
 * tapped photo. No vertical neighbours; no extra read.
 */
export function tilePhotoViewerArgs(row: readonly TilePhoto[], tapped: number, course: { id: string; name: string }, coursePosts: readonly FeedPost[]) {
  const pairs = row.map((p, i) => ({ i, p, item: photoItem(p, course, coursePosts) })).filter((x) => x.item);
  if (!pairs.length) return null;
  const template = (pairs[0].p.kind === 'hole'
    ? holeShotsToFeedPosts((pairs[0].p as TileHolePhoto).rows ?? [], course.name, course.id, 0)
    : coursePostsToShotPosts(coursePosts, course.id, course.name))[0];
  if (!template) return null;
  const post: FeedPost = { ...template, id: `shots:played:${course.id}`, mediaItems: pairs.map((x) => x.item!) };
  const hit = pairs.find((x) => x.i === tapped) ?? pairs[0];
  return { posts: [post], index: 0, mediaId: hit.item!.id, posterUrl: hit.p.imageUrl };
}

export type TileReview = { rating: number | null; text: string | null; date: string | null; breakdown: { design: number | null; conditions: number | null; clubhouse: number | null; facilities: number | null } };
export type TileSources = { reviewOf: Map<string, string | null>; reviews: Map<string, TileReview>; media: Map<string, ReviewMediaItem[]> };

const sourceIdOf = (p: TilePhoto) => (p.kind === 'hole' ? p.sourcePostId : p.postId) ?? null;
export const tileSourceIds = (row: readonly TilePhoto[]) => [...new Set(row.map(sourceIdOf).filter((x): x is string => !!x))].sort();
const sourcesKey = (ids: readonly string[]) => ['tile-photo-sources', ...ids] as const;

export async function readTileSources(queryClient: QueryClient, postIds: readonly string[]): Promise<TileSources> {
  const reviewOf = new Map<string, string | null>();
  const reviews = new Map<string, TileReview>();
  if (!postIds.length) return { reviewOf, reviews, media: new Map() };
  const { data: posts, error } = await supabase.from('posts').select('id, source_review_id, whs_score_id').in('id', [...postIds]);
  if (error) throw error;
  for (const row of (posts ?? []) as Array<{ id: string; source_review_id: string | null; whs_score_id: string | null }>) {
    reviewOf.set(row.id, row.whs_score_id ? null : row.source_review_id ?? null);
  }
  const reviewIds = [...new Set([...reviewOf.values()].filter((x): x is string => !!x))];
  if (!reviewIds.length) return { reviewOf, reviews, media: new Map() };
  const [ratings, media] = await Promise.all([
    supabase.from('course_ratings').select('id, rating, review, review_date, design_score, condition_score, clubhouse_score, facilities_score').in('id', reviewIds),
    fetchReviewMediaBatch(queryClient, reviewIds),
  ]);
  if (ratings.error) throw ratings.error;
  for (const r of (ratings.data ?? []) as any[]) reviews.set(String(r.id), {
    rating: r.rating ?? null, text: r.review ?? null, date: r.review_date ?? null,
    breakdown: { design: r.design_score ?? null, conditions: r.condition_score ?? null, clubhouse: r.clubhouse_score ?? null, facilities: r.facilities_score ?? null },
  });
  return { reviewOf, reviews, media };
}

const sourcesQuery = (queryClient: QueryClient, ids: readonly string[]) => ({
  queryKey: sourcesKey(ids), queryFn: () => readTileSources(queryClient, ids), staleTime: 5 * 60 * 1000, retry: false,
});

/** Prefetch on rail render (B-r5). */
export function prefetchTileSources(queryClient: QueryClient, row: readonly TilePhoto[]) {
  const ids = tileSourceIds(row);
  if (!ids.length) return;
  void queryClient.prefetchQuery(sourcesQuery(queryClient, ids)).catch(() => {});
}

/** One page per source in rail order (B-r3/B-r4); null when nothing opens. */
export function tileSourcePages(row: readonly TilePhoto[], tapped: number, course: { id: string; name: string }, coursePosts: readonly FeedPost[], src: TileSources) {
  type Group = { key: string; photos: { p: TilePhoto; i: number }[] };
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  row.forEach((p, i) => {
    const sid = sourceIdOf(p);
    const rid = sid ? src.reviewOf.get(sid) ?? null : null;
    const key = rid ? `r:${rid}` : sid ? `p:${sid}` : 'none';
    let g = byKey.get(key);
    if (!g) { g = { key, photos: [] }; byKey.set(key, g); groups.push(g); }
    g.photos.push({ p, i });
  });
  const pages: { post: FeedPost; photoIds: Map<number, string> }[] = [];
  for (const g of groups) {
    let post: FeedPost | null = null;
    if (g.key.startsWith('r:')) {
      const reviewId = g.key.slice(2);
      const media = src.media.get(reviewId) ?? [];
      const review = src.reviews.get(reviewId);
      const first = g.photos[0].p;
      if (media.length) post = reviewFeedPost({
        reviewId, userId: first.memberId, displayName: first.memberName, avatarUrl: first.memberPhoto,
        text: review?.text ?? null, createdAt: review?.date ?? null, courseId: course.id, courseName: course.name,
        rating: review?.rating ?? null, breakdown: review?.breakdown ?? null,
        media: media.map((m) => ({ id: m.id, type: m.mediaType, url: m.mediaUrl, posterUrl: m.posterUrl, streamId: m.streamId, width: m.width, height: m.height })),
      });
    } else if (g.key.startsWith('p:')) {
      const sid = g.key.slice(2);
      const first = g.photos[0].p;
      if (first.kind === 'course') {
        post = coursePostsToShotPosts(coursePosts.filter((cp) => cp.id === sid), course.id, course.name)[0] ?? null;
      } else {
        const rows = [...new Map(g.photos.flatMap(({ p }) => (p.kind === 'hole' ? p.rows ?? [] : []))
          .filter((r) => r.source_post_id === sid).map((r) => [r.id, r])).values()];
        post = rows.length ? holeShotsToFeedPosts(rows, course.name, course.id, first.holeNo)[0] ?? null : null;
      }
    }
    if (!post || !post.mediaItems.length) {
      const args = tilePhotoViewerArgs(g.photos.map((x) => x.p), 0, course, coursePosts);
      if (!args) continue;
      post = { ...args.posts[0], id: `${args.posts[0].id}:${g.key}` };
    }
    const photoIds = new Map<number, string>();
    for (const { p, i } of g.photos) {
      const own = photoItem(p, course, coursePosts);
      const hit = post.mediaItems.find((m) => m.id === p.mediaId || (own && m.id === own.id))
        ?? post.mediaItems.find((m) => !!p.imageUrl && (m.imageUrl === p.imageUrl || m.thumbnailUrl === p.imageUrl))
        ?? post.mediaItems[0];
      photoIds.set(i, hit.id);
    }
    pages.push({ post, photoIds });
  }
  const index = pages.findIndex((pg) => pg.photoIds.has(tapped));
  if (index < 0) return null;
  return { posts: pages.map((pg) => pg.post), index, mediaId: pages[index].photoIds.get(tapped)!, posterUrl: row[tapped].imageUrl };
}

const TAP_WAIT_MS = 800;

/** BRIEF 20 B: open the tapped photo's source page; failure → today's single item. */
const EMPTY_SOURCES: TileSources = { reviewOf: new Map(), reviews: new Map(), media: new Map() };

export async function openTilePhotoSources(queryClient: QueryClient, row: readonly TilePhoto[], tapped: number, course: { id: string; name: string }, coursePosts: readonly FeedPost[], inSheet = false): Promise<boolean> {
  const ids = tileSourceIds(row);
  // Sourceless rows and already-read sources open in the same tick (no await).
  const ready = ids.length ? queryClient.getQueryData<TileSources>(sourcesKey(ids)) : EMPTY_SOURCES;
  if (ready) return openArgs(tileSourcePages(row, tapped, course, coursePosts, ready), inSheet);
  let args: ReturnType<typeof tileSourcePages> = null;
  try {
    const src = ids.length
      ? await Promise.race([
          queryClient.fetchQuery(sourcesQuery(queryClient, ids)),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), TAP_WAIT_MS)),
        ])
      : { reviewOf: new Map(), reviews: new Map(), media: new Map() } as TileSources;
    args = tileSourcePages(row, tapped, course, coursePosts, src);
  } catch {
    // Today's single item; when the tapped photo has no item of its own, today's row page.
    args = tilePhotoViewerArgs([row[tapped]], 0, course, coursePosts) ?? tilePhotoViewerArgs(row, tapped, course, coursePosts);
  }
  return openArgs(args, inSheet);
}

function openArgs(args: ReturnType<typeof tileSourcePages>, inSheet: boolean): boolean {
  if (!args) return false;
  openWithOrigin({
    ...args,
    originEl: null,
    openedFrom: PLAYED_VIEWER_ORIGIN,
    options: { syntheticPosts: true, ...(inSheet ? { zIndex: VIEWER_ABOVE_SHEETS_Z } : {}) },
  });
  return true;
}

export function openTilePhoto(row: readonly TilePhoto[], tapped: number, course: { id: string; name: string }, coursePosts: readonly FeedPost[], inSheet = false): boolean {
  const args = tilePhotoViewerArgs(row, tapped, course, coursePosts);
  if (!args) return false;
  openWithOrigin({
    ...args,
    originEl: null,
    openedFrom: PLAYED_VIEWER_ORIGIN,
    options: { syntheticPosts: true, ...(inSheet ? { zIndex: VIEWER_ABOVE_SHEETS_Z } : {}) },
  });
  return true;
}
