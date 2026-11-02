/**
 * WS2 — the middle of the Watch page: pure rules and shared row mapping for
 * Filmed at your courses, By region and the two grid pages (/watch/courses,
 * /watch/region/:region). Reads are the four WATCH_S2_V1 RPCs only; every one
 * returns nothing signed out, so guests never see either shelf.
 */
import type { Database } from '@/integrations/supabase/types';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';

export type WatchVideoRow = Database['public']['Functions']['get_watch_course_videos']['Returns'][number];
export type WatchRegionRow = Database['public']['Functions']['get_watch_regions']['Returns'][number];
export type WatchRegionCourseRow = Database['public']['Functions']['get_watch_region_courses']['Returns'][number];

export const COURSE_SHELF_LIMIT = 12;
export const COURSE_SHELF_MIN = 2;
export const REGIONS_MIN = 3;
export const GRID_PAGE = 30;

export const showsCourseShelf = (rows: number) => rows >= COURSE_SHELF_MIN;
export const showsRegionsShelf = (regions: number) => regions >= REGIONS_MIN;

/** "1 video" / "{n} videos". */
export function videosLabel(n: number): string {
  return n === 1 ? '1 video' : `${n} videos`;
}

export function coursesLabel(n: number): string {
  return n === 1 ? '1 course' : `${n} courses`;
}

export function regionPath(region: string): string {
  return `/watch/region/${encodeURIComponent(region)}`;
}

/** Keyset cursor: the last row's created_at, or undefined when the page was short. */
export function nextCursor(page: { created_at: string }[], size = GRID_PAGE): string | undefined {
  return page.length >= size ? page[page.length - 1]?.created_at : undefined;
}

/** Short age: "now", "12m", "5h", "3d" inside a week, "Apr" this year, "Apr 2025" before. */
export function shortAge(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const mins = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days <= 6) return `${days}d`;
  const month = then.toLocaleDateString('en-GB', { month: 'short' });
  return then.getFullYear() === now.getFullYear() ? month : `${month} ${then.getFullYear()}`;
}

/** "{display_name} · {age}", or the name alone when there is no date. */
export function whoLine(row: Pick<WatchVideoRow, 'display_name' | 'created_at'>, now?: Date): string {
  const age = shortAge(row.created_at, now);
  return [row.display_name, age].filter(Boolean).join(' \u00b7 ');
}

/** The viewer's row shape, mapped exactly as WatchLead maps its row. */
export function toHubRow(row: WatchVideoRow): HubRpcRow {
  const personal = row.actor_type === 'personal';
  const business = row.actor_type === 'business';
  return {
    post_id: row.post_id,
    post_content: row.caption,
    post_created_at: row.created_at,
    post_user_id: personal ? row.actor_id : null,
    post_actor_type: row.actor_type,
    post_actor_id: row.actor_id,
    actor_id: row.actor_id,
    actor_type: row.actor_type,
    media_type: 'video',
    media_url: row.media_url,
    poster_url: row.poster_url,
    hls_url: row.hls_url,
    stream_id: row.stream_id,
    duration_seconds: row.duration_seconds,
    width: row.width,
    height: row.height,
    creator_username: personal ? row.handle : null,
    creator_display_name: row.display_name,
    creator_avatar_url: row.avatar_url,
    creator_is_verified: row.is_verified,
    business_name: business ? row.display_name : null,
    business_logo_url: business ? row.avatar_url : null,
    business_is_verified: business ? row.is_verified : null,
    like_count: row.like_count,
    course_id: row.course_id,
    course_name: row.course_name,
  };
}
