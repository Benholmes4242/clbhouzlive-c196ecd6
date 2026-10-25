/** BRIEF_MEMBER_SHOTS_SWIPE_ACROSS — one synthetic post owns the canonical
 * horizontal carousel for a course or hole; memberShot captions belong to media items.
 * BRIEF_MEMBER_SHOTS_VIEWER_POLISH: both hole entrypoints use get_hole_media
 * rows for member avatars and scored/unscored caption data.
 * Every caller must set readOnly and syntheticPosts. Synthetic ids never
 * enter real-post requests; real-post and vertical paging behaviour is frozen. */
import { toFeedPosts, type HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { addedMonthLabel } from './addedMonth';
import { holeOrdinal } from './holeWalk';
import { shareCourseName } from '@/lib/courses/shareCourseName';

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
  member_avatar_url?: string | null;
  hole_no?: number;
  par?: number | null;
  yards?: number | null;
}


const ready = (item: MediaItem) => item.type !== 'video' ||
  (!item.isProcessing && !!(item.hlsUrl || item.mp4Url || item.streamId));
const credit = (name: string | null | undefined, date: string | null | undefined) =>
  [name, addedMonthLabel(date)].filter(Boolean).join(' · ');

function syntheticPost(id: string, courseId: string, courseName: string, displayName: string,
  avatarUrl: string | null | undefined, shots: Array<{ item: MediaItem; date?: string | null }>): FeedPost[] {
  if (!shots.length) return [];
  const newest = shots.reduce<string>((latest, shot) => {
    const date = shot.date ?? '';
    return Number.isFinite(Date.parse(date)) && (!latest || Date.parse(date) > Date.parse(latest)) ? date : latest;
  }, '');
  return [{
    id, userId: '', actorType: 'personal', actorId: '', username: '', displayName,
    avatarUrl: avatarUrl ?? '', isVerified: false, creatorRelation: 'none', caption: '',
    createdAt: newest, mediaItems: shots.map(shot => shot.item),
    likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false,
    isLikedByMe: false, isFollowedByMe: false, courseId, courseName,
    courseThumbnailImage: avatarUrl ?? null,
  }];
}

/** Preserve get_hole_media / hole-walk order, skipping null-duration videos. */
export function holeShotsToFeedPosts(rows: readonly MemberShotRow[], courseName = '',
  courseId = rows[0]?.course_id ?? '', holeNo = 0, thumbnail?: string | null): FeedPost[] {
  const { short, variant } = shareCourseName(courseName);
  const coursePart = short + (variant ? ` (${variant})` : '');
  const readyRows = rows.filter(row => row.media_type !== 'video' || row.duration_seconds != null);
  const hubRows: HubRpcRow[] = readyRows.map(row => ({
    post_id: row.id, media_id: row.id, post_created_at: row.added_at ?? null,
    post_user_id: row.member_id ?? null, post_actor_type: 'personal', post_status: 'published',
    media_type: row.media_type, media_url: row.media_url, poster_url: row.poster_url ?? null,
    stream_id: row.stream_id ?? null, duration_seconds: row.duration_seconds ?? null,
    width: row.width ?? null, height: row.height ?? null, creator_display_name: row.member_name ?? null,
    review_course_id: row.course_id, review_course_name: courseName,
    like_count: 0, comment_count: 0, share_count: 0,
  }));
  const mapped = toFeedPosts(hubRows);
  const shots = mapped.flatMap((post, index) => post.mediaItems.map(item => ({
    item: { ...item, memberShot: {
      kicker: `The ${holeOrdinal(readyRows[index]?.hole_no ?? holeNo)}`,
      title: coursePart + (readyRows[index]?.par != null
        ? ` · Par ${readyRows[index].par}${readyRows[index].yards != null ? ` · ${readyRows[index].yards} yards` : ''}` : ''),
      credit: credit(readyRows[index]?.member_name, readyRows[index]?.added_at),
      avatarUrl: readyRows[index]?.member_avatar_url ?? null,
      memberName: readyRows[index]?.member_name ?? '',
    } },
    date: readyRows[index]?.added_at,
  })));
  return syntheticPost(`shots:hole:${courseId}:${holeNo}`, courseId, courseName,
    `${courseName} · The ${holeOrdinal(holeNo)}`, thumbnail, shots);
}

/** Preserve Media-tab post-then-media order and the existing ready-source filter. */
export function coursePostsToShotPosts(posts: readonly FeedPost[],
  courseId = posts[0]?.courseId ?? '', courseName = posts[0]?.courseName ?? '',
  thumbnail = posts.find(post => post.courseThumbnailImage)?.courseThumbnailImage): FeedPost[] {
  const shots = posts.flatMap(post => post.mediaItems.filter(ready).map(item => ({
    item: { ...item, memberShot: {
      kicker: "Through members' eyes", title: courseName,
      credit: credit(post.displayName, post.createdAt),
      avatarUrl: post.avatarUrl || null, memberName: post.displayName,
    } }, date: post.createdAt,
  })));
  return syntheticPost(`shots:course:${courseId}`, courseId, courseName, courseName, thumbnail, shots);
}
