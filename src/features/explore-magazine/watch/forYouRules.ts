/** Brief 42 — For you cuts. Pure rules (no React, no reads) so every section's
 * selection, order and the page-wide one-appearance rule live once. */
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import type { ProKind } from '@/features/pro-verification/proRules';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { isQuickHit } from './watchRules';

export const FEATURED_SHOWN = 5;
export const COACH_LIMIT = 12;
export const COACH_VIDEO_LIMIT = 24;
export const COACHING_TILES = 12;
export const LONG_RAIL = 10;
export const FOLLOWING_MAX = 12;
export const FOLLOWING_MIN = 2;
export const MOST_LIKED_MAX = 8;
export const MOST_LIKED_MIN = 3;
const DAY = 86_400_000;

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0) || 0;
export const rowTime = (row: HubRpcRow) => time(row.post_created_at);
export const newestFirst = (a: HubRpcRow, b: HubRpcRow) => rowTime(b) - rowTime(a);

export interface FeaturedReasonInput {
  post_id: string;
  like_count: number | null | undefined;
  created_at: string | null | undefined;
  course_name: string | null | undefined;
  actor_type?: string | null;
  actor_id?: string | null;
}

/** The first that applies: most liked in the set, PGA pro, tour pro, filmed at, new this week, else none. */
export function featuredReason(item: FeaturedReasonInput, set: FeaturedReasonInput[], proKind: ProKind | null | undefined, now = Date.now()): string | null {
  const top = set.reduce<FeaturedReasonInput | null>((best, r) => (best == null || Number(r.like_count ?? 0) > Number(best.like_count ?? 0) ? r : best), null);
  if (top && top.post_id === item.post_id && Number(top.like_count ?? 0) > 0) return 'Most liked this week';
  if (proKind === 'teaching_pro') return 'From a PGA pro';
  if (proKind === 'tour_pro') return 'From a tour pro';
  if (item.course_name?.trim()) return `Filmed at ${shortCourseName(item.course_name)}`;
  if (item.created_at && now - time(item.created_at) < 7 * DAY) return 'New this week';
  return null;
}

export interface CoachRow { user_id: string; display_name: string | null; username: string | null; avatar_url: string | null; pro_body: string | null; pro_club: string | null; pro_verified_at: string | null }
export interface CoachWithVideos { coach: CoachRow; videos: HubRpcRow[] }

/** Brief 43 — every coach kept: coaches with videos first by latest video (newest first),
 * then coaches with none by pro_verified_at (newest first). */
export function orderCoaches(list: CoachWithVideos[]): CoachWithVideos[] {
  const verified = (c: CoachWithVideos) => { const t = c.coach.pro_verified_at ? Date.parse(c.coach.pro_verified_at) : NaN; return Number.isFinite(t) ? t : -Infinity; };
  const withV = list.filter(c => c.videos.length > 0)
    .map(c => ({ c, latest: Math.max(...c.videos.map(rowTime)) }))
    .sort((a, b) => b.latest - a.latest).map(x => x.c);
  const none = list.filter(c => c.videos.length === 0).sort((a, b) => verified(b) - verified(a));
  return [...withV, ...none].map(({ coach, videos }) => ({ coach, videos }));
}

/** Every coach's videos merged, newest first, de-duplicated by post. */
export function coachingVideos(list: CoachWithVideos[]): HubRpcRow[] {
  const seen = new Set<string>();
  return list.flatMap(c => c.videos).sort(newestFirst).filter(r => !seen.has(r.post_id) && !!seen.add(r.post_id));
}

export const videoCountLabel = (n: number) => (n >= COACH_VIDEO_LIMIT ? `${COACH_VIDEO_LIMIT}+` : String(n));

const take = (rows: HubRpcRow[], used: Set<string>, max: number) => {
  const out: HubRpcRow[] = [];
  for (const row of rows) {
    if (out.length >= max) break;
    if (used.has(row.post_id)) continue;
    out.push(row);
  }
  out.forEach(r => used.add(r.post_id));
  return out;
};

export interface ForYouCuts { coaching: HubRpcRow[]; longForm: HubRpcRow[]; following: HubRpcRow[]; mostLiked: HubRpcRow[] }

/** One appearance per video across Featured, Coaching, Long form, Following and Most liked; earlier wins.
 * Following and Most liked are absent (empty) below their minimums. */
export function forYouCuts({ featuredIds, coaching, rows, viewerId, now = Date.now() }: { featuredIds: string[]; coaching: HubRpcRow[]; rows: HubRpcRow[]; viewerId?: string | null; now?: number }): ForYouCuts {
  const used = new Set(featuredIds);
  const coachingCut = take(coaching, used, COACHING_TILES);
  const long = rows.filter(r => !isQuickHit(r.duration_seconds)).sort(newestFirst);
  const longForm = take(long, used, LONG_RAIL);
  const own = (r: HubRpcRow) => !!viewerId && (r.post_user_id ?? r.actor_id) === viewerId;
  const followedPool = [...rows].filter(r => !!r.is_followed_by_me && !own(r)).sort(newestFirst);
  const followingCandidates = followedPool.filter(r => !used.has(r.post_id)).slice(0, FOLLOWING_MAX);
  const following = followingCandidates.length >= FOLLOWING_MIN ? take(followingCandidates, used, FOLLOWING_MAX) : [];
  const liked = long.filter(r => Number(r.like_count ?? 0) >= 1 && now - rowTime(r) <= 30 * DAY && !used.has(r.post_id))
    .sort((a, b) => Number(b.like_count ?? 0) - Number(a.like_count ?? 0) || newestFirst(a, b)).slice(0, MOST_LIKED_MAX);
  const mostLiked = liked.length >= MOST_LIKED_MIN ? take(liked, used, MOST_LIKED_MAX) : [];
  return { coaching: coachingCut, longForm, following, mostLiked };
}
