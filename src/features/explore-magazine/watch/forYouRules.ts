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
export const BUSINESS_LIMIT = 12;
export const BUSINESS_TILES = 12;
export const BUSINESS_MIN = 3;
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

/** Brief 46 — get_watch_businesses row (verified, live, ≥1 public video; newest first). */
export interface WatchBusinessRow { business_id: string; name: string; logo_url: string | null; category: string | null; city: string | null; region: string | null; country: string | null; video_count: number; latest_video_at: string | null }
export interface BusinessWithVideos { business: WatchBusinessRow; videos: HubRpcRow[] }
/** "<category> · <place>", place = city, else region, else country; missing parts and their dot omitted. */
export const businessLine = (b: Pick<WatchBusinessRow, 'category' | 'city' | 'region' | 'country'>) =>
  [b.category?.trim(), b.city?.trim() || b.region?.trim() || b.country?.trim()].filter(Boolean).join(' · ');
/** Only businesses with videos get a card, by latest video, newest first. */
export const orderBusinesses = (list: BusinessWithVideos[]) => list.filter(b => b.videos.length > 0)
  .map(b => ({ b, latest: Math.max(...b.videos.map(rowTime)) })).sort((x, y) => y.latest - x.latest).map(x => x.b);

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

export interface ForYouCuts { coaching: HubRpcRow[]; longForm: HubRpcRow[]; following: HubRpcRow[]; businesses: HubRpcRow[] }

/** One appearance per video across Featured, Coaching, Long form, Following and Clubs and brands; earlier wins.
 * Following and Clubs and brands are absent (empty) below their minimums. */
export function forYouCuts({ featuredIds, coaching, rows, viewerId, businesses = [] }: { featuredIds: string[]; coaching: HubRpcRow[]; rows: HubRpcRow[]; viewerId?: string | null; businesses?: HubRpcRow[]; now?: number }): ForYouCuts {
  const used = new Set(featuredIds);
  const coachingCut = take(coaching, used, COACHING_TILES);
  const long = rows.filter(r => !isQuickHit(r.duration_seconds)).sort(newestFirst);
  const longForm = take(long, used, LONG_RAIL);
  const own = (r: HubRpcRow) => !!viewerId && (r.post_user_id ?? r.actor_id) === viewerId;
  const followedPool = [...rows].filter(r => !!r.is_followed_by_me && !own(r)).sort(newestFirst);
  const followingCandidates = followedPool.filter(r => !used.has(r.post_id)).slice(0, FOLLOWING_MAX);
  const following = followingCandidates.length >= FOLLOWING_MIN ? take(followingCandidates, used, FOLLOWING_MAX) : [];
  const businessLeft = businesses.filter(r => !used.has(r.post_id));
  const businessCut = businessLeft.length >= BUSINESS_MIN ? take(businessLeft, used, BUSINESS_TILES) : [];
  return { coaching: coachingCut, longForm, following, businesses: businessCut };
}
