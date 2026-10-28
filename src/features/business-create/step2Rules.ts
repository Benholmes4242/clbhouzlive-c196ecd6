/**
 * BC2 — canonical Create-a-business step 2 pure rules (/business/create).
 * Club-card figures, place lines and small text helpers live here so the three
 * branch components stay presentational and the arithmetic is testable without
 * a render. Nothing here touches the database.
 */
import { ordinal } from '@/lib/text/numbers';
import { courseStatsVisible } from '@/features/onboarding/welcomeRules';

/** Mirrors public.normalize_club_key(): lower(trim(name)) with non [a-z0-9] removed.
 *  Same rule the editor's club guard uses; the unique index includes deleted rows. */
export function normalizeClubKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export interface ClubGeo {
  sub_country?: string | null;
  region?: string | null;
  country?: string | null;
}

/** Search-result row place: "Bromley, Kent" (sub_country, region), country as fallback. */
export function searchResultPlace(club: ClubGeo): string {
  return [club.sub_country, club.region].filter(Boolean).join(', ') || club.country || '';
}

/** Club card place line: "{sub_country or region}, {region or country}" plus
 *  " · n courses" when the club has more than one course. */
export function clubPlaceLine(club: ClubGeo, courseCount: number): string {
  const first = club.sub_country || club.region || '';
  const second = club.sub_country ? club.region || club.country || '' : club.country || '';
  const base = [first, second].filter(Boolean).join(', ');
  return courseCount > 1 ? `${base} · ${courseCount} courses` : base;
}

export interface ClubCourseStatRow {
  rounds_tracked: number | null;
  avg_over_par: number | null;
  hardest_hole_no?: number | null;
}

export interface ClubFacts {
  rounds: number;
  /** Signed one-decimal rounds-weighted mean of avg_over_par ("+14.6"), null when no weighted data. */
  plays: string | null;
  third: { value: string; label: 'Courses' | 'Hardest' };
}

/**
 * Club card facts row. 'no-rounds' when the totals fail the same visibility
 * rule courseStatsVisible uses (the card then prints the no-rounds line
 * instead of the facts row). How it plays is the rounds-weighted mean of
 * avg_over_par across the club's courses, signed to one decimal. Third slot:
 * course count above one course, else the single course's hardest hole.
 */
export function clubCardFacts(courseCount: number, stats: ClubCourseStatRow[]): ClubFacts | 'no-rounds' {
  const rounds = stats.reduce((sum, r) => sum + (r.rounds_tracked ?? 0), 0);
  if (!courseStatsVisible({ rounds_tracked: rounds })) return 'no-rounds';
  let weightedSum = 0;
  let weightedRounds = 0;
  for (const r of stats) {
    const rRounds = r.rounds_tracked ?? 0;
    if (r.avg_over_par != null && rRounds > 0) {
      weightedSum += r.avg_over_par * rRounds;
      weightedRounds += rRounds;
    }
  }
  const mean = weightedRounds > 0 ? weightedSum / weightedRounds : null;
  const plays = mean != null ? `${mean >= 0 ? '+' : ''}${mean.toFixed(1)}` : null;
  const third = courseCount > 1
    ? { value: String(courseCount), label: 'Courses' as const }
    : { value: stats[0]?.hardest_hole_no != null ? ordinal(stats[0].hardest_hole_no) : '—', label: 'Hardest' as const };
  return { rounds, plays, third };
}

/** College crest-tile initials: first letter of the first and last word
 *  ("University of Stirling" → "US"), one letter for a single word. */
export function nameInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0]!.toUpperCase();
  return `${words[0][0]!.toUpperCase()}${words[words.length - 1][0]!.toUpperCase()}`;
}

/** Business name-match tile: a single initial ("Kestrel Golf Academy" → "K"). */
export function nameInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '';
}

export const CLAIM_PROOF_NOTE_MAX = 500;
