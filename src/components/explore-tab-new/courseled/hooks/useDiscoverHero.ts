import { useMemo } from 'react';

import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import { useCourseCardMeta } from './useCourseCardMeta';
import { useRoundHoleShapes } from './useRoundHoleShapes';
import {
  orderForWeek,
  usePlayedCourseIds,
  useGolfThisWeek,
  useWeekScopeCourses,
  type WeekScope,
} from './useGolfThisWeek';
import { useWeekRegionCounts, type RegionSelection } from './useWeekRegionCounts';
import { selectMoment, type Moment } from '../roundMoment';

/**
 * THE PAGE HERO'S SUBJECT (BRIEF_DISCOVER_HERO_ROTATION).
 *
 * THE HERO PROMOTES ONE OF THE SECTION'S OWN ROUNDS, and that overlap is
 * INTENDED. It reads the same `ordered` array GolfThisWeek renders, in the same
 * fourteen-day window, under the same scope and region selection, and shows one
 * of those rounds at hero scale on a TWELVE-HOUR ROTATION. Change the scope or
 * region pill and the pool changes with it, so the hero can never show a round
 * the section is filtering out.
 *
 * THE SLOT COMES FROM THE CLOCK, NOT FROM STATE: no useState, no interval, no
 * localStorage. Two consequences are the whole point — the hero cannot repeat
 * itself by chance, and every member sees the same hero at the same moment.
 *
 * THE LEAD SLOT: a genuinely rare feat (ace, albatross, course record) takes the
 * hero immediately and holds it for one slot, then rejoins the rotation.
 *
 * ZERO NEW NETWORK REQUESTS (ACCEPTANCE I). Every hook below is the SAME hook
 * GolfThisWeek calls with the SAME arguments, so every read resolves out of the
 * react-query cache the section already populated: the scope allow-list, the
 * fourteen-day rounds, the course meta and the ONE batched hole-shape read.
 *
 * MOMENT detection remains in roundMoment.ts. This hook only chooses WHICH
 * already-classified round appears, and WHEN.
 */

type HeroCandidate = { row: CircleRoundRow; moment: Moment };

const rarityTier = (moment: Moment) => {
  if (moment.kind === 'eagle' && (moment.feat === 'ace' || moment.feat === 'albatross')) return 2;
  if (moment.kind === 'courseRecord') return 1;
  return 0;
};

/** Twelve hours. The rotation's only clock. */
export const SLOT_MS = 12 * 60 * 60 * 1000;

/** The slot index for a moment in time. Exported so tests can pin it. */
export const slotForTime = (ms: number) => Math.floor(ms / SLOT_MS);

/**
 * A rare feat leads from the slot its round appeared in and through the next TWO
 * slots' worth of boundaries (see the `<= LEAD_SLOTS` comparison below).
 * play_date is the only arrival signal available (the arrival-stamp work is
 * parked), so it anchors the window.
 */
const LEAD_SLOTS = 2;


const playSlot = (playDate: unknown): number => {
  const ms = Date.parse(`${String(playDate ?? '').slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : slotForTime(ms);
};

/**
 * PURE: the slot is an argument, never Date.now() in here.
 *
 * A rare feat inside its lead window wins (rarer first, then more recent);
 * otherwise the slot indexes the pool in the SECTION'S OWN ORDER so the hero and
 * the section never disagree about ranking. The double modulo guards a negative
 * slot rather than assuming the clock is positive.
 */
export function selectDiscoverHeroCandidate(
  candidates: readonly HeroCandidate[],
  slot: number,
): HeroCandidate | null {
  if (candidates.length === 0) return null;

  const leads = candidates.filter(({ row, moment }) => {
    if (rarityTier(moment) === 0) return false;
    const start = playSlot(row.play_date);
    return slot >= start && slot - start <= LEAD_SLOTS;
  });
  if (leads.length > 0) {
    return [...leads].sort(
      (a, b) =>
        rarityTier(b.moment) - rarityTier(a.moment) ||
        String(b.row.play_date).localeCompare(String(a.row.play_date)),
    )[0];
  }

  const index = ((slot % candidates.length) + candidates.length) % candidates.length;
  return candidates[index];
}

export interface DiscoverHeroSubject {
  row: CircleRoundRow;
  moment: Moment;
  courseName: string | null;
  region: string | null;
  imageUrl: string | null;
}

export interface DiscoverHeroResult {
  /** `null` means NO HERO RENDERS — no placeholder, no reserved height. */
  subject: DiscoverHeroSubject | null;
  /** True while the section's own reads are in flight. The hero renders nothing. */
  isPending: boolean;
  /** Reported figures (§REPORT 1 and 5). Cheap, derived, no extra read. */
  stats: { rounds: number; allPlain: boolean; withImage: number };
}

export function useDiscoverHero(
  userId: string | undefined,
  scope: WeekScope,
  region: RegionSelection | null,
): DiscoverHeroResult {
  const scopeCourses = useWeekScopeCourses(userId, scope);
  const roundsQuery = useGolfThisWeek(userId, scope, scopeCourses.courseIds);
  const all = roundsQuery.data ?? [];

  const courseIds = useMemo(
    () => all.map((r) => r.course_id).filter((v): v is string => !!v),
    [all],
  );
  const played = usePlayedCourseIds(userId);
  const playedSet = useMemo(() => new Set(played.ids), [played.ids]);
  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;

  const regions = useWeekRegionCounts(all, meta);
  const inRegion = useMemo(
    () => all.filter((r) => regions.matches(r, region)),
    [all, regions, region],
  );
  const ordered = useMemo(() => orderForWeek(inRegion, playedSet), [inRegion, playedSet]);

  const scoreIds = useMemo(() => ordered.map((r) => r.score_id), [ordered]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  const isPending = !!userId && (roundsQuery.isPending || !scopeCourses.ready);

  return useMemo(() => {
    const withImage = ordered.filter((r) => !!meta?.get(r.course_id ?? '')?.imageUrl).length;

    const slot = slotForTime(Date.now());

    let allPlain = true;
    const candidates = ordered.map((r) => {
      const shape = holeShapes?.get(r.score_id ?? '') ?? null;
      const moment = selectMoment(shape?.holes ?? [], r.course_record_fact);
      if (moment.kind !== 'plain') allPlain = false;
      return { row: r, moment };
    });
    const best = selectDiscoverHeroCandidate(candidates, slot);

    const subject: DiscoverHeroSubject | null =
      best
        ? {
            row: best.row,
            moment: best.moment,
            courseName: meta?.get(best.row.course_id ?? '')?.name ?? best.row.course_name ?? null,
            region: meta?.get(best.row.course_id ?? '')?.region ?? null,
            imageUrl: meta?.get(best.row.course_id ?? '')?.imageUrl ?? null,
          }
        : null;

    return {
      subject: isPending ? null : subject,
      isPending,
      stats: { rounds: ordered.length, allPlain: ordered.length > 0 && allPlain, withImage },
    };
  }, [ordered, holeShapes, meta, isPending]);
}

export default useDiscoverHero;
