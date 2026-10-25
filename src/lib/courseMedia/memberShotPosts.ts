/** BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS §1 — shared builders that turn
 * member shots into one-FeedPost-per-shot lists for the CANONICAL full-screen
 * viewer (FullscreenFeedOverlay via openWithOrigin). The Latest holes cards,
 * the Latest from the courses cards and the hole walk panel all page
 * vertically through these, every shot its own page, credited to the member
 * who added it. The ids are synthetic (shot ids, or `post::item`), so every
 * open must pass options.readOnly — see the readOnly gates in
 * FullscreenFeedOverlay / ImmersiveFullscreenChrome. */
import { toFeedPosts, type HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import type { FeedPost } from '@/components/media-system/types/media';

/** A get_hole_media row, or a hole walk ready shot normalised to the same
 * shape (member_id/member_name filled from user_id + the authors map). */
export interface MemberShotRow {
  id: string;
  course_id: string;
  media_type: string;
  media_url: string;
  poster_url?: string | null;
  stream_id?: string | null;
  duration_seconds?: number | null;
  width?: number | null;
  height?: number | null;
  added_at?: string | null;
  member_id?: string | null;
  member_name?: string | null;
}

/** One HubRpcRow per shot through toFeedPosts (1:1, no grouping). Processing
 * videos (null duration) are skipped. */
export function holeShotsToFeedPosts(rows: readonly MemberShotRow[], courseName?: string): FeedPost[] {
  const hubRows: HubRpcRow[] = rows
    .filter(row => row.media_type !== 'video' || row.duration_seconds != null)
    .map(row => ({
      post_id: row.id,
      media_id: row.id,
      post_created_at: row.added_at ?? null,
      post_user_id: row.member_id ?? null,
      post_actor_type: 'personal',
      post_status: 'published',
      media_type: row.media_type,
      media_url: row.media_url,
      poster_url: row.poster_url ?? null,
      stream_id: row.stream_id ?? null,
      duration_seconds: row.duration_seconds ?? null,
      width: row.width ?? null,
      height: row.height ?? null,
      creator_display_name: row.member_name ?? null,
      review_course_id: row.course_id,
      review_course_name: courseName ?? null,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
    }));
  return toFeedPosts(hubRows);
}

/** Explodes a useGalleryCourseMedia set into one single-media FeedPost per
 * item, posts in order then each post's media in order. Processing videos
 * and videos with no playable source are skipped. The id is made unique
 * (`post::item`) so the viewer's keys never collide; author, course and date
 * stay those of the real post. */
export function coursePostsToShotPosts(posts: readonly FeedPost[]): FeedPost[] {
  const out: FeedPost[] = [];
  for (const post of posts) {
    for (const item of post.mediaItems) {
      if (item.type === 'video' && (item.isProcessing || (!item.hlsUrl && !item.mp4Url && !item.streamId))) continue;
      out.push({ ...post, id: `${post.id}::${item.id}`, mediaItems: [item] });
    }
  }
  return out;
}
