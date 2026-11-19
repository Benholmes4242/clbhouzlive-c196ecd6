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
 */
import type { FeedPost } from '@/components/media-system/types/media';
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
