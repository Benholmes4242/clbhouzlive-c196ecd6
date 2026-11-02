/**
 * WS3 — the bottom of the Watch page: pure rules for Creator to follow and
 * Top 100 on film. Reads are the WATCH_S3_V1 RPCs only (get_watch_spotlight,
 * get_creator_videos, get_watch_top100_videos); all return nothing signed out.
 * Video rows share the WS2 shape, so tiles, age and the viewer reuse watchMiddle.
 */
import type { Database } from '@/integrations/supabase/types';
import { formatHcp } from '@/lib/formatHcp';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { videosLabel } from './watchMiddle';

export type SpotlightRow = Database['public']['Functions']['get_watch_spotlight']['Returns'][number];
export type Top100VideoRow = Database['public']['Functions']['get_watch_top100_videos']['Returns'][number];

export const SPOTLIGHT_VIDEOS = 3;
export const TOP100_SHELF_LIMIT = 12;
export const TOP100_MIN = 3;

export const showsTop100Shelf = (rows: number) => rows >= TOP100_MIN;

/** "{area} · {n} videos", the area dropped when null. */
export function spotlightLine(row: Pick<SpotlightRow, 'area' | 'videos'>): string {
  const area = row.area ? shortCourseName(row.area) : '';
  return [area, videosLabel(Number(row.videos ?? 0))].filter(Boolean).join(' \u00b7 ');
}

export type SpotlightCell = { key: 'handicap' | 'rounds' | 'courses' | 'videos' | 'filmed'; value: string };

/** With rounds: Handicap (only when visible), Rounds, Courses. Without: Videos, Courses filmed (hidden at 0). */
export function spotlightCells(row: Pick<SpotlightRow, 'rounds' | 'handicap_index' | 'courses_played' | 'videos' | 'courses_filmed'>): SpotlightCell[] {
  const rounds = Number(row.rounds ?? 0);
  if (rounds > 0) {
    const out: SpotlightCell[] = [];
    if (row.handicap_index !== null && row.handicap_index !== undefined) out.push({ key: 'handicap', value: formatHcp(row.handicap_index) });
    out.push({ key: 'rounds', value: String(rounds) });
    out.push({ key: 'courses', value: String(Number(row.courses_played ?? 0)) });
    return out;
  }
  const out: SpotlightCell[] = [{ key: 'videos', value: String(Number(row.videos ?? 0)) }];
  const filmed = Number(row.courses_filmed ?? 0);
  if (filmed > 0) out.push({ key: 'filmed', value: String(filmed) });
  return out;
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
