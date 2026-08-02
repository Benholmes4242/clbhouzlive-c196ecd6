import { useMemo } from 'react';

import { useRegionFeats, type FeatRow } from './useRegionFeats';
import { A, toParParts } from '@/features/courses/components/holes/analytical/tokens';
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

export type WireKind = 'crown' | 'ace' | 'albatross' | 'eagle' | 'birdie_haul';

export interface WireEvent {
  id: string;
  kind: WireKind;
  /** ISO date or timestamp. Sorting and day-grouping key. */
  at: string;
  actorName: string;
  actorAvatar: string | null;
  userId: string | null;
  isOwn: boolean;
  courseId: string | null;
  courseName: string | null;
  courseImage: string | null;
  /** Only the genuinely rare is tagged: hole in one and albatross. */
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
  const n = parseFloat(String(v ?? '').replace(/[^\d.\-]/g, ''));
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
    actionParams: { category: categoryLabel ?? category.replace(/_/g, ' ') },
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

export interface DiscoverWireResult {
  events: WireEvent[];
  isLoading: boolean;
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
  const records = useRegionFeats(region, 'records', 'latest', live);
  const legendary = useRegionFeats(region, 'legendary', 'latest', live);
  const eagles = useRegionFeats(region, 'eagles', 'latest', live);
  const hauls = useRegionFeats(region, 'birdie_hauls', 'latest', live);

  const isLoading =
    records.isLoading || legendary.isLoading || eagles.isLoading || hauls.isLoading;

  const events = useMemo(() => {
    const out: WireEvent[] = [];
    (records.data ?? []).forEach((row, i) => {
      const e = crownEvent(row, i, userId, categoryLabel(row.category));
      if (e) out.push(e);
    });
    (legendary.data ?? []).forEach((row, i) => {
      const e = legendaryEvent(row, i, userId);
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
    out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    return out;
  }, [records.data, legendary.data, eagles.data, hauls.data, userId, categoryLabel]);

  return { events, isLoading };
}

export type WireGroupId = 'today' | 'thisWeek' | 'earlier';

export interface WireGroup {
  id: WireGroupId;
  events: WireEvent[];
}

const DAY_MS = 86_400_000;

/** Day grouping. A group with no events is not returned. */
export function groupWireEvents(events: WireEvent[]): WireGroup[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const buckets: Record<WireGroupId, WireEvent[]> = { today: [], thisWeek: [], earlier: [] };
  for (const e of events) {
    const t = Date.parse(e.at);
    if (Number.isNaN(t)) buckets.earlier.push(e);
    else if (t >= todayMs) buckets.today.push(e);
    else if (t >= todayMs - 6 * DAY_MS) buckets.thisWeek.push(e);
    else buckets.earlier.push(e);
  }
  return (['today', 'thisWeek', 'earlier'] as WireGroupId[])
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({ id, events: buckets[id] }));
}

export const WIRE_TONE = { over: A.RED, under: A.GREEN } as const;
