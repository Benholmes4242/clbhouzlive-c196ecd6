/**
 * seasonClock -- single source of truth for the Ascent season calendar.
 *
 * A "season" is a calendar quarter. Naming is hemisphere-aware so a UK
 * player in Q3 sees "Summer Season" and an AU player in Q3 sees "Winter
 * Season". Season IDs are hemisphere-agnostic (season_{year}_q{n}) so
 * the catalogue and evaluator use one identifier space.
 */

import { formatMonthShortGB, formatDayMonthShortGB } from '@/i18n/format';

export type Hemisphere = 'N' | 'S';


export interface Quarter {
  year: number;
  /** 1..4 */
  quarter: number;
  /** UTC midnight on the first day of the quarter. */
  startDate: Date;
  /** UTC midnight on the first day of the FOLLOWING quarter (exclusive). */
  endDate: Date;
}

/** Quarter containing `date` (UTC). */
export function quarterOf(date: Date): Quarter {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const q = Math.floor(m / 3) + 1;
  const startMonth = (q - 1) * 3;
  const startDate = new Date(Date.UTC(y, startMonth, 1));
  const endDate = new Date(Date.UTC(y, startMonth + 3, 1));
  return { year: y, quarter: q, startDate, endDate };
}

/** Days remaining until the end of the quarter containing `date`. */
export function daysLeft(date: Date): number {
  const { endDate } = quarterOf(date);
  return Math.max(0, Math.ceil((endDate.getTime() - date.getTime()) / 86_400_000));
}

/** Canonical badge id for a season (matches gam_badge_catalogue). */
export function seasonId(year: number, quarter: number): string {
  return `season_${year}_q${quarter}`;
}

// Explicit southern-hemisphere country list. Hemisphere, not timezone --
// names track local seasons. Anything else / unknown defaults to 'N'.
const SOUTHERN = new Set([
  'AU', 'NZ', 'ZA', 'AR', 'CL', 'UY', 'PY', 'BO', 'PE',
  'BR', 'ID', 'FJ', 'ZW', 'NA', 'BW', 'MZ', 'MG', 'PG',
]);

export function hemisphereFor(country: string | null | undefined): Hemisphere {
  if (!country) return 'N';
  const code = country.trim().toUpperCase();
  return SOUTHERN.has(code) ? 'S' : 'N';
}

const NAMES_N: Record<number, string> = { 1: 'Winter', 2: 'Spring', 3: 'Summer', 4: 'Autumn' };
const NAMES_S: Record<number, string> = { 1: 'Summer', 2: 'Autumn', 3: 'Winter', 4: 'Spring' };

/** e.g. "Summer Season" */
export function seasonName(quarter: number, hemisphere: Hemisphere): string {
  const map = hemisphere === 'S' ? NAMES_S : NAMES_N;
  return `${map[quarter] ?? 'Season'} Season`;
}

/** e.g. "Summer Season 2026" */
export function seasonDisplay(year: number, quarter: number, hemisphere: Hemisphere): string {
  return `${seasonName(quarter, hemisphere)} ${year}`;
}

/** Parses a season_{year}_q{n} id. Returns null when the id doesn't match. */
export function parseSeasonId(id: string): { year: number; quarter: number } | null {
  const m = /^season_(\d{4})_q([1-4])$/.exec(id);
  if (!m) return null;
  return { year: Number(m[1]), quarter: Number(m[2]) };
}

/** Localised display name if the id is a season, else null. */
export function seasonDisplayForBadgeId(id: string, hemisphere: Hemisphere): string | null {
  const parsed = parseSeasonId(id);
  if (!parsed) return null;
  return seasonDisplay(parsed.year, parsed.quarter, hemisphere);
}

/** MEDAL THRESHOLD for a season badge. MUST MATCH the evaluator constant
 *  in supabase/functions/gam-evaluator/index.ts (SEASON_ROUNDS_REQUIRED). */
export const SEASON_ROUNDS_REQUIRED = 5;

/** Short month range e.g. "Jul - Sep 2026". */
export function seasonDateRange(year: number, quarter: number): string {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  const fmt = (m: number) =>
    formatMonthShortGB(new Date(Date.UTC(year, m, 1)));
  return `${fmt(startMonth)} - ${fmt(endMonth)} ${year}`;
}

/** "1 Oct" style. */
export function shortStartDate(year: number, quarter: number): string {
  const startMonth = (quarter - 1) * 3;
  return formatDayMonthShortGB(new Date(Date.UTC(year, startMonth, 1)));
}

