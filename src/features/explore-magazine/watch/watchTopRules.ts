/**
 * WS1 — PURE RULES for the top of the Watch page (watch-s1.html, signed off):
 * the Creators row and the lead video. No DOM, no locale, no dates here — the
 * components read these so the row, the sheet and the lead cannot drift.
 *
 * THE CREATORS ROW hides itself under CREATORS_MIN and shows See all only
 * above CREATORS_SEE_ALL_MAX. THE LEAD is upright when the source is taller
 * than wide OR when either dimension is missing (the mock's rule), landscape
 * otherwise. An empty caption falls back to the course name, then to nothing.
 */
import { shortCourseName } from '@/lib/courses/shortCourseName';

/** Hide the Creators row, heading included, when the read returns fewer. */
export const CREATORS_MIN = 3;
/** See all appears only when the read returns MORE than this many. */
export const CREATORS_SEE_ALL_MAX = 8;
/** The See-all sheet asks the read for every creator up to this cap. */
export const CREATORS_SHEET_LIMIT = 50;

export function showsCreatorsRow(count: number): boolean {
  return count >= CREATORS_MIN;
}

export function showsCreatorsSeeAll(count: number): boolean {
  return count > CREATORS_SEE_ALL_MAX;
}

export type WatchLeadShape = 'upright' | 'landscape';

/** Upright when height > width, or when EITHER dimension is missing. */
export function leadShape(width: number | null | undefined, height: number | null | undefined): WatchLeadShape {
  if (!width || !height) return 'upright';
  return height > width ? 'upright' : 'landscape';
}

export type WatchLeadReason = 'creator_new' | 'most_liked';

/** The kicker copy key by reason; an unknown reason reads as creator_new. */
export function leadKickerKey(reason: string | null | undefined): 'new' | 'liked' {
  return reason === 'most_liked' ? 'liked' : 'new';
}

/** Caption, else the course name, else no caption line at all. */
export function leadCaption(caption: string | null | undefined, courseName: string | null | undefined): string | null {
  const text = (caption ?? '').trim();
  if (text) return text;
  const course = (courseName ?? '').trim();
  return course || null;
}

export type CreatorSecondLine =
  | { kind: 'week'; count: number }
  | { kind: 'area'; area: string }
  | null;

/** "{n} this week" when the creator posted in the last 7 days; otherwise the
 *  area through shortCourseName; nothing when there is no area. */
export function creatorSecondLine(videos7d: number | null | undefined, area: string | null | undefined): CreatorSecondLine {
  if ((videos7d ?? 0) > 0) return { kind: 'week', count: videos7d ?? 0 };
  const short = area ? shortCourseName(area) : '';
  return short ? { kind: 'area', area: short } : null;
}
