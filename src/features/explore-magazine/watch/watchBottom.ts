/**
 * WS3 — the bottom of the Watch page: pure rules for Creator to follow and
 * Top 100 on film. Reads use get_watch_spotlights,
 * get_creator_videos, get_watch_top100_videos); all return nothing signed out.
 * Video rows share the WS2 shape, so tiles, age and the viewer reuse watchMiddle.
 */
import type { Database } from '@/integrations/supabase/types';
import { videosLabel } from './watchMiddle';

export type SpotlightRow = Database['public']['Functions']['get_watch_spotlights']['Returns'][number];
export type Top100VideoRow = Database['public']['Functions']['get_watch_top100_videos']['Returns'][number];

export const SPOTLIGHT_VIDEOS = 3;
export const TOP100_SHELF_LIMIT = 12;
export const TOP100_MIN = 3;

export const showsTop100Shelf = (rows: number) => rows >= TOP100_MIN;

/** WS6 newest loaded video's age; absent/failed reads never invent recency. */
export function spotlightRelative(createdAt: string | null | undefined, now = new Date()): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.max(0, Math.round((today - day) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 56) { const weeks = Math.floor(days / 7); return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`; }
  return `in ${date.toLocaleDateString('en-GB', { month: 'long' })}`;
}

export function spotlightLine(row: Pick<SpotlightRow, 'videos'>, createdAt?: string | null, now?: Date): string {
  const relative = spotlightRelative(createdAt, now);
  return [videosLabel(Number(row.videos ?? 0)), relative].filter(Boolean).join(' \u00b7 ');
}

/** "{list_label} #{list_rank}". */
export function rankPill(row: Pick<Top100VideoRow, 'list_label' | 'list_rank'>): string {
  return `${row.list_label} #${row.list_rank}`;
}

/** Personal profile route or /business/{slug}. */
export function spotlightPath(row: Pick<SpotlightRow, 'actor_type' | 'actor_id' | 'handle'>, personal: (id: string, handle: string | null) => string): string {
  if (row.actor_type === 'business') return `/business/${row.handle || row.actor_id}`;
  return personal(row.actor_id, row.handle ?? null);
}
