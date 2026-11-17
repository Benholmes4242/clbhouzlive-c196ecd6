/**
 * What's been played tile photo taps (BRIEF_WHATS_BEEN_PLAYED_V4 §3): a photo
 * opens the canonical full-screen viewer on that photo, never the course page.
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

export function tilePhotoViewerArgs(photo: TileHolePhoto | TileCoursePhoto, course: { id: string; name: string }, coursePosts: readonly FeedPost[]) {
  const post = photo.kind === 'hole'
    ? holeShotsToFeedPosts(photo.rows ?? [], course.name, course.id, photo.holeNo)[0]
    : coursePostsToShotPosts(coursePosts, course.id, course.name)[0];
  if (!post || post.mediaItems.length === 0) return null;
  const items = post.mediaItems;
  let target = items[0];
  if (photo.kind === 'hole') {
    target = items.find((i) => i.id === photo.mediaId) ?? target;
  } else {
    const source = new Set(coursePosts.find((p) => p.id === photo.postId)?.mediaItems.map((i) => i.id) ?? []);
    target = items.find((i) => i.id === photo.mediaId) ?? items.find((i) => source.has(i.id)) ?? target;
  }
  return { posts: [post], index: 0, mediaId: target.id, posterUrl: photo.imageUrl };
}

export function openTilePhoto(photo: TileHolePhoto | TileCoursePhoto, course: { id: string; name: string }, coursePosts: readonly FeedPost[], inSheet = false): boolean {
  const args = tilePhotoViewerArgs(photo, course, coursePosts);
  if (!args) return false;
  openWithOrigin({
    ...args,
    originEl: null,
    openedFrom: PLAYED_VIEWER_ORIGIN,
    options: { readOnly: true, syntheticPosts: true, ...(inSheet ? { zIndex: VIEWER_ABOVE_SHEETS_Z } : {}) },
  });
  return true;
}
