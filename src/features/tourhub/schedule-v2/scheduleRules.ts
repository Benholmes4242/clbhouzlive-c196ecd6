/**
 * scheduleRules — pure presentation rules for the rebuilt Tour Schedule
 * (BRIEF_TOUR_SCHEDULE_REBUILT, schedule-signed-off.html).
 *
 * Everything here is a pure function over SeasonEvent/date inputs so the row,
 * the week headers and the next-major card can be unit-tested without a
 * render. No negative letter-spacing anywhere on this surface.
 */
import {
  formatDayMonthYearShortGB,
  formatMonthShortGB,
  formatWeekdayShortGB,
  formatYearNumeric,
} from '@/i18n/format';
import { surnameOf } from '../_shared/playerName';
import type { TourId } from '../hooks/useOverviewData';
import type { SeasonEvent } from './useSeasonTimeline';

// ─── Tour labels + within-week order (mock, §3/§4) ───────────────────────

export const ROW_TOUR_LABEL: Record<TourId, string> = {
  pga: 'PGA Tour',
  liv: 'LIV Golf',
  euro: 'DP World',
  lpga: 'LPGA',
  pgad: 'Korn Ferry',
  champ: 'Champions',
};

/** Within-week tie-break order after start date: pga, liv, euro, lpga, pgad, champ. */
export const ROW_TOUR_ORDER: TourId[] = ['pga', 'liv', 'euro', 'lpga', 'pgad', 'champ'];

export function rowTourIndex(slug: TourId | string | null | undefined): number {
  const i = ROW_TOUR_ORDER.indexOf((slug ?? '') as TourId);
  return i === -1 ? ROW_TOUR_ORDER.length : i;
}

// ─── Tag (one at most, by priority; never amber) ─────────────────────────

export type ScheduleTag = 'major' | 'seasonFinale' | 'playoffs' | 'team';

export function scheduleTag(evt: {
  isMajor: boolean;
  isPlayoff: boolean;
  name: string;
  eventType?: string | null;
}): ScheduleTag | null {
  if (evt.isMajor) return 'major';
  const n = evt.name.toLowerCase();
  if (n.includes('tour championship') || n.includes('schwab cup championship')) {
    return 'seasonFinale';
  }
  if (evt.isPlayoff) return 'playoffs';
  if ((evt.eventType ?? '').toLowerCase() === 'team') return 'team';
  return null;
}

// ─── Venue line: "{venue} · {city}", country only when no city, never a region ─

const REGION_WORDS = new Set([
  'asia',
  'caribbean',
  'europe',
  'africa',
  'middle east',
  'north america',
  'south america',
  'central america',
  'oceania',
  'australasia',
  'scandinavia',
]);

function isRegion(value: string): boolean {
  return REGION_WORDS.has(value.trim().toLowerCase());
}

export function venueLine(evt: {
  venueName: string | null;
  venueCity: string | null;
  coursePlace?: string | null;
  venueCountry: string | null;
}): string {
  const venue = evt.venueName?.trim() || '';
  let place = (evt.coursePlace ?? evt.venueCity)?.trim() || '';
  if (place && isRegion(place)) place = '';
  if (!place) {
    const country = evt.venueCountry?.trim() || '';
    if (country && !isRegion(country)) place = country;
  }
  return [venue, place].filter(Boolean).join(' · ');
}

// ─── Date spans ──────────────────────────────────────────────────────────

function utcNoon(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

/** Row dates: "Thu 5 – Sun 8 Nov"; both months when they differ ("Thu 29 Oct – Sun 1 Nov"). */
export function dateSpanLabel(startIso: string, endIso: string): string {
  const s = utcNoon(startIso);
  const e = utcNoon(endIso);
  const sameMonth =
    s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  const left = sameMonth
    ? `${formatWeekdayShortGB(s)} ${s.getUTCDate()}`
    : `${formatWeekdayShortGB(s)} ${s.getUTCDate()} ${formatMonthShortGB(s)}`;
  return `${left} – ${formatWeekdayShortGB(e)} ${e.getUTCDate()} ${formatMonthShortGB(e)}`;
}

/** Week header span: "26 Oct – 1 Nov"; the year appears when the week is not in the current year. */
export function weekRangeLabel(mondayKey: string, now: Date = new Date()): string {
  const s = utcNoon(mondayKey);
  const e = new Date(s);
  e.setUTCDate(e.getUTCDate() + 6);
  const currentYear = now.getUTCFullYear();
  const withYear =
    s.getUTCFullYear() !== currentYear || e.getUTCFullYear() !== currentYear;
  const sMonth = formatMonthShortGB(s);
  const eMonth = formatMonthShortGB(e);
  if (withYear) {
    const sYear = formatYearNumeric(s);
    const eYear = formatYearNumeric(e);
    const left =
      sYear === eYear
        ? `${s.getUTCDate()} ${sMonth}`
        : `${s.getUTCDate()} ${sMonth} ${sYear}`;
    return `${left} – ${e.getUTCDate()} ${eMonth} ${eYear}`;
  }
  return sMonth === eMonth
    ? `${s.getUTCDate()} – ${e.getUTCDate()} ${sMonth}`
    : `${s.getUTCDate()} ${sMonth} – ${e.getUTCDate()} ${eMonth}`;
}

/** Next-major card date: "Thu 8 Apr 2027". */
export function nextMajorDateLabel(iso: string): string {
  const d = utcNoon(iso);
  return `${formatWeekdayShortGB(d)} ${formatDayMonthYearShortGB(d)}`;
}

// ─── Purse short form: "$9m", "$3.25m", "$500k" ──────────────────────────

export function formatPurseShort(purse: number | null | undefined): string | null {
  if (purse == null || purse <= 0) return null;
  if (purse >= 1_000_000) {
    const m = purse / 1_000_000;
    const text = Number.isInteger(m)
      ? String(m)
      : m.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return `$${text}m`;
  }
  return `$${Math.round(purse / 1000)}k`;
}

// ─── Right column model (§4) ─────────────────────────────────────────────

export type RightColumn =
  | {
      kind: 'won';
      name: string;
      fullName: string;
      score: number | null;
      scoreText: string;
      photoUrl: string | null;
      tourCode: string | null;
      playerId: string | null;
    }
  | {
      kind: 'leads' | 'tied';
      name: string;
      fullName: string;
      tiedCount: number;
      round: number | null;
      score: number | null;
      scoreText: string;
      photoUrl: string | null;
      tourCode: string | null;
      playerId: string | null;
    }
  | { kind: 'defends'; name: string; fullName: string; photoUrl: string | null; purse: string | null }
  | { kind: 'purse'; purse: string }
  | { kind: 'none' };

export function rightColumn(evt: SeasonEvent): RightColumn {
  if (evt.state === 'completed' && evt.champion) {
    const fullName = evt.champion.name || evt.champion.displayName;
    return {
      kind: 'won',
      name: surnameOf(fullName),
      fullName,
      score: evt.champion.score,
      scoreText: evt.champion.scoreText,
      photoUrl: evt.champion.photoUrl,
      tourCode: evt.champion.tourCode,
      playerId: evt.champion.playerId,
    };
  }
  if (evt.state === 'live' && evt.leader) {
    const tiedCount = evt.leader.tiedCount ?? 1;
    const fullName = evt.leader.name || evt.leader.displayName;
    return {
      kind: tiedCount > 1 ? 'tied' : 'leads',
      name: surnameOf(fullName),
      fullName,
      tiedCount,
      round: evt.leader.currentRound ?? null,
      score: evt.leader.score,
      scoreText: evt.leader.totalText,
      photoUrl: evt.leader.photoUrl,
      tourCode: evt.leader.tourCode,
      playerId: evt.leader.playerId,
    };
  }
  if (evt.state === 'upcoming') {
    const purse = formatPurseShort(evt.purse);
    if (evt.defendingChampion?.name) {
      return {
        kind: 'defends',
        name: surnameOf(evt.defendingChampion.name),
        fullName: evt.defendingChampion.name,
        photoUrl: evt.defendingChampion.photoUrl ?? null,
        purse,
      };
    }
    if (purse) return { kind: 'purse', purse };
  }
  return { kind: 'none' };
}

// ─── Season spans + breaks (Schedule across seasons) ─────────────────────

/** One season's summary inside the merged schedule list. */
export interface SeasonSpan {
  year: number;
  /** The season row's tour full name ("Champions Tour"); null when unknown. */
  tourName: string | null;
  /** Events of this season in the LIST (same filter as the rows). */
  eventCount: number;
  /** Earliest start date (yyyy-MM-dd) among those events. */
  firstStart: string | null;
}

/**
 * Season summaries over the filtered, sorted event list, in date order.
 * The event count is the same filter as the list — never a raw table count.
 */
export function seasonSpans(
  events: Array<{ seasonYear?: number | null; startDate: string }>,
  tourNameByYear: Map<number, string | null>,
): SeasonSpan[] {
  const byYear = new Map<number, { count: number; first: string }>();
  for (const e of events) {
    if (e.seasonYear == null) continue;
    const hit = byYear.get(e.seasonYear);
    if (hit) {
      hit.count += 1;
      if (e.startDate < hit.first) hit.first = e.startDate;
    } else {
      byYear.set(e.seasonYear, { count: 1, first: e.startDate });
    }
  }
  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, v]) => ({
      year,
      tourName: tourNameByYear.get(year) ?? null,
      eventCount: v.count,
      firstStart: v.first,
    }));
}

export interface SeasonBreak {
  ending: SeasonSpan;
  starting: SeasonSpan;
}

/**
 * The event id BEFORE WHICH a season break renders, for every boundary in
 * the sorted list. One break per boundary, never two.
 */
export function seasonBreakBoundaries(
  events: Array<{ id: string; seasonYear?: number | null }>,
  spans: SeasonSpan[],
): Map<string, SeasonBreak> {
  const byYear = new Map(spans.map((s) => [s.year, s]));
  const out = new Map<string, SeasonBreak>();
  let prev: number | null = null;
  for (const e of events) {
    const y = e.seasonYear ?? null;
    if (y != null && prev != null && y !== prev) {
      const ending = byYear.get(prev);
      const starting = byYear.get(y);
      if (ending && starting) out.set(e.id, { ending, starting });
    }
    if (y != null) prev = y;
  }
  return out;
}

// ─── "In the field" names (§5) ───────────────────────────────────────────

export interface FieldPlayer {
  id: string;
  name: string;
}

/** Followed players in an event's field, as display surnames, field order kept. */
export function followedFieldNames(
  field: FieldPlayer[] | undefined,
  followedIds: Set<string>,
): string[] {
  if (!field || followedIds.size === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of field) {
    if (!followedIds.has(p.id) || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(surnameOf(p.name));
  }
  return out;
}
