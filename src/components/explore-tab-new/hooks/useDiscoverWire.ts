import { useMemo } from 'react';

import { ALLTIME_RAIL_STALE_MS, useRegionFeats, type FeatRow } from './useRegionFeats';
import { A, TOPAR_RED, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { getActiveLocale } from '@/i18n';
import { formatNumber, formatOrdinal } from '@/i18n/format';

/**
 * useDiscoverWire — one chronological feed for Discover (BRIEF_DISCOVER_THE_WIRE).
 *
 * The record book, "This week in golf" and "Moments of the game" were the same
 * thing wearing three costumes: a notable event with an actor, a course, a
 * figure and a timestamp. They already shared one source (`discover_rail_cache`,
 * keyed by `rail_key`), so the merge is client-side and needs no server change.
 *
 * CROWN VOLUME (brief 7.4): the wire reads the CURATED `records:<region>` rail,
 * not `gam_notification_outbox`. That rail is already one row per course and
 * category, so the "X took all 8 crowns at a course nobody else has played"
 * flood cannot reach this surface through here. Contested-only filtering in
 * `refresh_discover_feats` remains the right server-side home for a raw crown
 * feed if one is ever wired in.
 *
 * Copy is composed from parameterised locale keys — never concatenated
 * fragments, and no English in the components. `ACTION_DEFAULTS` carries the en
 * default for each key so a missing translation degrades to English prose
 * rather than a raw key.
 */

/**
 * WIRE KINDS.
 *
 * `under_par` and `bogey_free` are the two ROUND-LEVEL kinds added for
 * BRIEF_ATW_MASONRY (as corrected). Each has its OWN rail —
 * `feats:<region>:under_par` and `feats:<region>:bogey_free` — produced
 * server-side by `refresh_discover_feats`; until that migration lands the rail
 * reads return empty payloads and no events of these kinds exist.
 *
 * 45+ Stableford is deliberately ABSENT: its source column carries two
 * different metrics and cannot be trusted. Do not reintroduce it.
 */
export type WireKind =
  | 'crown'
  | 'ace'
  | 'albatross'
  | 'eagle'
  | 'birdie_haul'
  | 'under_par'
  | 'bogey_free';

export interface WireEvent {
  id: string;
  kind: WireKind;
  /** ISO date or timestamp. Sorting and month-grouping key. */
  at: string;
  actorName: string;
  actorAvatar: string | null;
  userId: string | null;
  isOwn: boolean;
  courseId: string | null;
  courseName: string | null;
  courseImage: string | null;
  /**
   * Rarity tag. Aces and albatrosses have left the wire for "Rarest of all"
   * (BRIEF_DISCOVER_REBUILD §2.1), so nothing in the month groups is tagged
   * unless a records-rail kind is ever found to be materially rarer.
   */
  tagKey?: 'ace' | 'albatross';
  actionKey: string;
  actionParams?: Record<string, string | number>;
  figure?: string;
  /** Locale key for the unit beneath the figure. */
  figureSubKey?: string;
  figureSubParams?: Record<string, string | number>;
  figureTone?: string;
  /** 3 = ace/albatross, 2 = record/crown, 1 = eagle/birdie haul. News dedupe. */
  rarity: 1 | 2 | 3;
  /** Legendary rows only — hole context for the "Rarest of all" panel. */
  holeNo?: number | null;
  holePar?: number | null;
  holeYards?: number | null;
  /** Round this feat came from. Absent on older cache rows — row is then inert. */
  scoreId?: string | null;
  /**
   * BENCHMARK for the feat, supplied by the server ("Previous best 4", "Best
   * here -8", "First clean card here"). RENDERED VERBATIM — already
   * person-neutral, already length-budgeted, never translated client-side and
   * never rebuilt from the other fields. Null on aces and albatrosses.
   */
  featMargin?: string | null;
}


export const ACTION_DEFAULTS: Record<string, string> = {
  'discover.wire.action.crown': 'Took {{category}}',
  'discover.wire.action.crownRecord': 'New course record',
  'discover.wire.action.ace': 'Aced the {{hole}}',
  'discover.wire.action.aceYards': 'Aced the {{hole}}, {{yards}} yds',
  'discover.wire.action.albatross': 'Albatross on the {{hole}}',
  'discover.wire.action.albatrossYards': 'Albatross on the {{hole}}, {{yards}} yds',
  'discover.wire.action.eagle': 'Eagled the {{hole}}',
  'discover.wire.action.eagleUnknownHole': 'Made an eagle',
  'discover.wire.action.birdieHaul': 'Made {{count}} birdies',
  'discover.wire.action.underPar': 'Went round under par',
  'discover.wire.action.bogeyFree': 'Went round bogey-free',
};

export const UNIT_DEFAULTS: Record<string, string> = {
  'discover.wire.unit.gross': 'gross',
  'discover.wire.unit.diff': 'diff',
  'discover.wire.unit.points': 'points',
  'discover.wire.unit.birdies': 'birdies',
  'discover.wire.unit.eagles': 'eagles',
  'discover.wire.unit.aces': 'aces',
  'discover.wire.unit.albatrosses': 'albatrosses',
  'discover.wire.unit.rounds': 'rounds',
  'discover.wire.unit.ace': 'ace',
  'discover.wire.unit.albatross': 'albatross',
  'discover.wire.unit.toPar': 'to par',
  'discover.wire.unit.bogeys': 'bogeys',
  'discover.wire.unit.rating': 'rating',
};

/** Crown category -> the label key and the unit that sits under its figure. */
const CATEGORY_UNIT: Record<string, string> = {
  lowest_gross: 'discover.wire.unit.gross',
  best_score_diff: 'discover.wire.unit.diff',
  best_stableford: 'discover.wire.unit.points',
  most_birdies: 'discover.wire.unit.birdies',
  most_eagles: 'discover.wire.unit.eagles',
  most_aces: 'discover.wire.unit.aces',
  most_albatrosses: 'discover.wire.unit.albatrosses',
  most_rounds: 'discover.wire.unit.rounds',
};

function stripWindow(category: string): string {
  return category.replace(/_(90d|all_time)$/, '');
}

/** "Holmes, Danny" -> "Danny Holmes". Mirrors the ledger helpers. */
function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return '';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function actorOf(row: FeatRow): string {
  return formatHolderName(row.holder_name) || (row.holder_username ?? '').trim();
}

function numeric(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = parseFloat(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** First integer in a feat_value string ("7th hole", "Hole 12"). */
function holeFrom(row: FeatRow): number | null {
  if (row.hole_no != null) return row.hole_no;
  const m = String(row.feat_value ?? row.value ?? '').match(/\d+/);
  return m ? Number(m[0]) : null;
}

function whenOf(row: FeatRow): string | null {
  return row.play_date ?? row.attained_at ?? null;
}

/**
 * Compact relative time for the wire ("2h", "3d", "1w"). The list is dense and
 * "2 hours ago" on every row would crowd the actor name off the line.
 */
export function wireWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const locale = getActiveLocale();
  if (locale.startsWith('en')) {
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    if (weeks < 5) return `${weeks}w`;
    return `${Math.floor(days / 30)}mo`;
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'narrow' });
  if (mins < 60) return rtf.format(-mins, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 7) return rtf.format(-days, 'day');
  if (weeks < 5) return rtf.format(-weeks, 'week');
  return rtf.format(-Math.floor(days / 30), 'month');
}

function baseEvent(row: FeatRow, kind: WireKind, at: string, index: number, userId?: string): Omit<WireEvent, 'actionKey' | 'rarity'> {
  return {
    id: `${kind}:${row.score_id ?? row.course_id ?? 'x'}:${row.category ?? row.feat_type ?? ''}:${at}:${index}`,
    kind,
    at,
    actorName: actorOf(row),
    actorAvatar: row.holder_avatar ?? null,
    userId: row.user_id ?? null,
    isOwn: !!userId && row.user_id === userId,
    courseId: row.course_id ?? null,
    courseName: row.course_name ?? null,
    courseImage: row.course_image ?? row.thumbnail_image ?? null,
    scoreId: row.score_id ?? null,
    featMargin: row.feat_margin ?? null,
  };
}

function crownEvent(row: FeatRow, index: number, userId?: string, categoryLabel?: string): WireEvent | null {
  const at = whenOf(row);
  if (!at) return null;
  const base = baseEvent(row, 'crown', at, index, userId);
  const category = stripWindow(row.category ?? '');
  const value = numeric(row.value);

  let figure: string | undefined;
  let figureTone: string | undefined;
  if (category === 'best_score_diff' && value != null) {
    const parts = toParParts(value, 1);
    if (parts) {
      figure = parts.text;
      figureTone = parts.tone;
    }
  } else if (value != null) {
    figure = formatNumber(Math.round(value));
  }

  return {
    ...base,
    actionKey: 'discover.wire.action.crown',
    actionParams: {
      category: categoryLabel ?? category.replace(/_/g, ' '),
      // Slug kept alongside the label so a callsite can special-case
      // lowest_gross ("New course record") without parsing English.
      categorySlug: category,
    },
    figure,
    figureTone,
    figureSubKey: CATEGORY_UNIT[category],
    rarity: 2,
  };
}

function legendaryEvent(row: FeatRow, index: number, userId?: string): WireEvent | null {
  const at = whenOf(row);
  if (!at) return null;
  const isAce = (row.feat_type ?? '').toLowerCase() === 'ace';
  const kind: WireKind = isAce ? 'ace' : 'albatross';
  const hole = holeFrom(row);
  const yards = row.hole_yards ?? null;
  const stem = isAce ? 'ace' : 'albatross';
  const actionKey =
    hole == null
      ? `discover.wire.action.${stem}`
      : yards != null
        ? `discover.wire.action.${stem}Yards`
        : `discover.wire.action.${stem}`;
  return {
    ...baseEvent(row, kind, at, index, userId),
    tagKey: kind,
    actionKey,
    actionParams: {
      hole: hole != null ? formatOrdinal(hole) : '',
      ...(yards != null ? { yards: formatNumber(yards) } : {}),
    },
    rarity: 3,
    holeNo: hole,
    holePar: row.hole_par ?? null,
    holeYards: yards,
  };
}


function eagleEvent(row: FeatRow, index: number, userId?: string): WireEvent | null {
  const at = whenOf(row);
  if (!at) return null;
  const hole = holeFrom(row);
  return {
    ...baseEvent(row, 'eagle', at, index, userId),
    actionKey: hole == null ? 'discover.wire.action.eagleUnknownHole' : 'discover.wire.action.eagle',
    actionParams: hole == null ? undefined : { hole: formatOrdinal(hole) },
    rarity: 1,
    holeNo: hole,
    holePar: row.hole_par ?? null,
  };
}

function birdieHaulEvent(row: FeatRow, index: number, userId?: string): WireEvent | null {
  const at = whenOf(row);
  if (!at) return null;
  const count = numeric(row.feat_value ?? row.value);
  if (count == null || count <= 0) return null;
  return {
    ...baseEvent(row, 'birdie_haul', at, index, userId),
    actionKey: 'discover.wire.action.birdieHaul',
    // Raw number for pluralisation, formatted value carried separately.
    actionParams: { count: Math.round(count), value: formatNumber(Math.round(count)) },
    figure: formatNumber(Math.round(count)),
    figureSubKey: 'discover.wire.unit.birdies',
    rarity: 1,
  };
}

/**
 * ROUND-LEVEL FEATS (BRIEF_ATW_MASONRY §5, as corrected) — under par and
 * bogey-free, each from its own rail. 45+ Stableford is removed: its source
 * column carries two different metrics and cannot be trusted.
 *
 * TO-PAR figures carry a TRUE MINUS (U+2212) so they align with tabular
 * figures in the tile chip.
 */
function underParEvent(row: FeatRow, index: number, userId?: string): WireEvent | null {
  const at = whenOf(row);
  if (!at) return null;
  const value = numeric(row.feat_value ?? row.value);
  if (value == null || value >= 0) return null;
  const n = Math.round(Math.abs(value));
  return {
    ...baseEvent(row, 'under_par', at, index, userId),
    actionKey: 'discover.wire.action.underPar',
    figure: `\u2212${formatNumber(n)}`,
    figureSubKey: 'discover.wire.unit.toPar',
    rarity: 2,
  };
}

function bogeyFreeEvent(row: FeatRow, index: number, userId?: string): WireEvent | null {
  const at = whenOf(row);
  if (!at) return null;
  return {
    ...baseEvent(row, 'bogey_free', at, index, userId),
    actionKey: 'discover.wire.action.bogeyFree',
    figure: formatNumber(0),
    figureSubKey: 'discover.wire.unit.bogeys',
    rarity: 2,
  };
}

export interface DiscoverWireResult {
  /** Inside the 90-day horizon, newest first. Legendary events excluded. */
  events: WireEvent[];
  /** All-time aces and albatrosses — rarity first, then newest. Not windowed. */
  legendary: WireEvent[];
  isLoading: boolean;
  /** Has NOT settled yet — the flag Discover sections gate their shells on. */
  isPending: boolean;
}

const DAY_MS = 86_400_000;

/** The one horizon on the page (BRIEF_DISCOVER_REBUILD §0.1). */
export const WIRE_HORIZON_DAYS = 90;

export function withinHorizon(iso: string | null | undefined): boolean {
  const t = Date.parse(String(iso ?? ''));
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - WIRE_HORIZON_DAYS * DAY_MS;
}

/**
 * @param categoryLabel injected by the caller so the crown category name comes
 *        from the shared `crownCategoryLabel` locale map rather than a second
 *        copy of it in here.
 */
export function useDiscoverWire(
  region: string | null,
  userId: string | undefined,
  categoryLabel: (category: string | null | undefined) => string,
): DiscoverWireResult {
  const live = { refetchOnWindowFocus: true };
  /**
   * The honours board is ALL-TIME records — it changes a few times a year, so
   * it does not ride the 10-minute wire threshold. Its rail has its own query
   * key (`legendary`), so this is a real separation, not a shared entry with
   * two opinions. It keeps the focus refetch: returning after a week should
   * show a new ace.
   */
  const honours = { refetchOnWindowFocus: true, staleTime: ALLTIME_RAIL_STALE_MS };
  const records = useRegionFeats(region, 'records', 'latest', live);
  const legendaryRail = useRegionFeats(region, 'legendary', 'latest', honours);
  const eagles = useRegionFeats(region, 'eagles', 'latest', live);
  const hauls = useRegionFeats(region, 'birdie_hauls', 'latest', live);
  // Empty payloads until `refresh_discover_feats` starts writing these rails.
  const bogeyFree = useRegionFeats(region, 'bogey_free', 'latest', live);
  const underPar = useRegionFeats(region, 'under_par', 'latest', live);

  const isLoading =
    records.isLoading || legendaryRail.isLoading || eagles.isLoading || hauls.isLoading ||
    bogeyFree.isLoading || underPar.isLoading;
  const isPending =
    records.isPending || legendaryRail.isPending || eagles.isPending || hauls.isPending ||
    bogeyFree.isPending || underPar.isPending;

  // The records rail is NOT windowed server-side (191 rows against 190 all
  // time), so the horizon is applied here or the month groups grow without
  // bound as the platform does.
  const events = useMemo(() => {
    const out: WireEvent[] = [];
    (records.data ?? []).forEach((row, i) => {
      const e = crownEvent(row, i, userId, categoryLabel(row.category));
      if (e) out.push(e);
    });
    (eagles.data ?? []).forEach((row, i) => {
      const e = eagleEvent(row, i, userId);
      if (e) out.push(e);
    });
    (hauls.data ?? []).forEach((row, i) => {
      const e = birdieHaulEvent(row, i, userId);
      if (e) out.push(e);
    });
    (bogeyFree.data ?? []).forEach((row, i) => {
      const e = bogeyFreeEvent(row, i, userId);
      if (e) out.push(e);
    });
    (underPar.data ?? []).forEach((row, i) => {
      const e = underParEvent(row, i, userId);
      if (e) out.push(e);
    });
    return out
      .filter((e) => withinHorizon(e.at))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }, [
    records.data,
    eagles.data,
    hauls.data,
    bogeyFree.data,
    underPar.data,
    userId,
    categoryLabel,
  ]);

  // Deliberately not windowed: history is the point of the panel.
  const legendary = useMemo(() => {
    const out: WireEvent[] = [];
    (legendaryRail.data ?? []).forEach((row, i) => {
      const e = legendaryEvent(row, i, userId);
      if (e) out.push(e);
    });
    const rank = (e: WireEvent) => (e.kind === 'ace' ? 0 : 1);
    return out.sort((a, b) => rank(a) - rank(b) || Date.parse(b.at) - Date.parse(a.at));
  }, [legendaryRail.data, userId]);

  return { events, legendary, isLoading, isPending };
}

export interface WireMonthGroup {
  /** Stable "2026-07" key. Also the analytics `month` value. */
  id: string;
  /** Localised month name; the year only when it is not the current year. */
  label: string;
  events: WireEvent[];
}

/**
 * Calendar-month grouping, newest first. A month with no events is simply
 * absent — at roughly a dozen events a month, day groups promised a daily
 * rhythm the platform does not have.
 */
export function groupWireByMonth(
  events: WireEvent[],
  labelFor: (year: number, monthIndex: number) => string,
): WireMonthGroup[] {
  const buckets = new Map<string, { year: number; month: number; events: WireEvent[] }>();
  for (const e of events) {
    const t = Date.parse(e.at);
    if (Number.isNaN(t)) continue;
    const d = new Date(t);
    const year = d.getFullYear();
    const month = d.getMonth();
    const id = `${year}-${String(month + 1).padStart(2, '0')}`;
    const bucket = buckets.get(id) ?? { year, month, events: [] };
    bucket.events.push(e);
    buckets.set(id, bucket);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([id, b]) => ({
      id,
      label: labelFor(b.year, b.month),
      events: b.events.sort((x, y) => Date.parse(y.at) - Date.parse(x.at)),
    }));
}

// BRIEF_UNDER_PAR_RED: under par red, over par ink.
export const WIRE_TONE = { over: A.INK, under: TOPAR_RED } as const;

