/**
 * CB113 — "You and {business}" for every non-club business, after the hero.
 * Markup is YouCardShell (shared with ClubYouCard). Reads:
 *  (1) circle via fetchCircleIds, then their personal follows of this
 *      business (newest first), names/avatars from user_profiles;
 *  (2) get_visible_handicaps for those golfers (average needs >= 3);
 *  (3) nearby categories with a pin: the hero's useBusinessNearbyCounts
 *      (same key) then useNearbyCourseStats (ONE get_course_stats_batch,
 *      key shared with BusinessNearbyCourses).
 * Nothing renders until every read settles; a failed read is empty, and a
 * failed batch drops the nearby sentences rather than printing a figure.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { fetchCircleIds } from '@/lib/social/circle';
import { formatHcp } from '@/lib/formatHcp';
import { formatNumber } from '@/i18n/format';
import { shortCourseName } from '@/features/courses/_shared/courseLabel';
import { NEARBY_CATEGORIES } from '@/lib/business/businessHero';
import { useBusinessNearbyCounts } from '@/hooks/useBusinessNearbyCounts';
import { useNearbyCourseStats } from '@/hooks/useNearbyCourseStats';
import { YouCardShell, type YouCardFace } from './YouCardShell';
import { useMyCoach } from '@/features/coach/hooks';
import { isCoachCategory } from '@/features/coach/contracts';
import { coachSentences } from '@/features/coach/copy';

type T = (key: string, opts: Record<string, unknown>) => string;
export interface NearbyStat { id: string; name: string; your_rounds: number | null; your_best: number | null }

/** Played/total/best across nearby courses; tie → more rounds, then name. */
export function nearbyFacts(stats: NearbyStat[]) {
  const played = stats.filter((s) => (s.your_rounds ?? 0) >= 1);
  const rounds = played.reduce((n, s) => n + (s.your_rounds ?? 0), 0);
  const best = played.filter((s) => s.your_best != null).sort((a, b) =>
    (a.your_best! - b.your_best!) || ((b.your_rounds ?? 0) - (a.your_rounds ?? 0)) || a.name.localeCompare(b.name))[0] ?? null;
  return { played: played.length, rounds, best };
}

export function nearbyTitle(n: number, f: ReturnType<typeof nearbyFacts>, t: T) {
  let first: string;
  if (n === 1) {
    first = f.played >= 1
      ? t('business.you.playedOne', { defaultValue: "You've played the one course near here." })
      : t('business.you.notPlayedOne', { defaultValue: "You haven't played the one course near here yet." });
  } else if (f.played >= 1) {
    first = t('business.you.playedOf', { played: formatNumber(f.played), n: formatNumber(n), defaultValue: "You've played {{played}} of the {{n}} courses near here." });
  } else {
    first = t('business.you.playedNone', { n: formatNumber(n), defaultValue: "You haven't played any of the {{n}} courses near here yet." });
  }
  let second = '';
  if (f.played >= 1 && f.best) {
    const opts = { best: formatNumber(f.best.your_best!), course: shortCourseName(f.best.name), defaultValue: '' };
    second = f.rounds === 1
      ? t('business.you.wentRound', { ...opts, defaultValue: 'You went round in {{best}}, at {{course}}.' })
      : t('business.you.bestAt', { ...opts, defaultValue: 'Your best is {{best}}, at {{course}}.' });
  }
  return { first, second };
}

const others = (k: number, t: T) => k === 1
  ? t('business.you.other_one', { count: k, defaultValue: 'other' })
  : t('business.you.other_other', { count: k, defaultValue: 'others' });

/** Faces line (nearby states A/B): names bold, rest muted. */
export function followFaces(players: YouCardFace[], name: string, t: T): { names: string; rest: string } {
  const a = players[0]?.display_name ?? '';
  const b = players[1]?.display_name ?? '';
  if (players.length === 1) return { names: a, rest: t('business.you.followsOne', { name, defaultValue: ', who you follow, follows {{name}}.' }) };
  if (players.length === 2) return { names: t('business.you.namesTwo', { a, b, defaultValue: '{{a}} and {{b}}' }), rest: t('business.you.followsTwo', { name, defaultValue: ', who you follow, follow {{name}}.' }) };
  const k = players.length - 2;
  return {
    names: t('business.you.namesList', { a, b, defaultValue: '{{a}}, {{b}}' }),
    rest: t('business.you.followsMany', { n: formatNumber(k), others: others(k, t), name, defaultValue: ' and {{n}} {{others}} you follow follow {{name}}.' }),
  };
}

/** Average of non-null indexes, only when at least three exist. */
export function averageHcp(values: Array<number | null | undefined>): string | null {
  const v = values.filter((x): x is number => x != null && Number.isFinite(x));
  if (v.length < 3) return null;
  return formatHcp(Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10);
}

type Golfer = YouCardFace & { handicap?: number | null };

function useFollowedGolfers(viewerId: string, businessId: string) {
  return useQuery({
    queryKey: ['business-you-followed', viewerId, businessId],
    staleTime: 60_000,
    queryFn: async (): Promise<Golfer[]> => {
      const circle = await fetchCircleIds(viewerId);
      if (circle.length === 0) return [];
      const { data, error } = await supabase
        .from('follows')
        .select('follower_actor_id, created_at')
        .eq('following_actor_type', 'business')
        .eq('following_actor_id', businessId)
        .eq('follower_actor_type', 'personal')
        .in('follower_actor_id', circle)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set(((data ?? []) as Array<{ follower_actor_id: string }>).map((r) => r.follower_actor_id))).filter((id) => id !== viewerId);
      if (ids.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase.from('user_profiles').select('id, display_name, profile_photo_url').in('id', ids);
      if (pErr) throw pErr;
      const byId = new Map(((profiles ?? []) as Array<{ id: string; display_name: string | null; profile_photo_url: string | null }>).map((p) => [p.id, p]));
      return ids.flatMap((id) => {
        const p = byId.get(id);
        const n = p?.display_name?.trim();
        return n ? [{ user_id: id, display_name: n, profile_photo_url: p!.profile_photo_url }] : [];
      });
    },
  });
}

function BusinessYouRead({ business, viewerId }: { business: BusinessYouInput; viewerId: string }) {
  const { t } = useTranslation();
  const tt: T = (k, o) => t(k, o) as string;
  const nearbyEligible = NEARBY_CATEGORIES.has(business.category ?? '') && business.lat != null && business.lng != null;
  const golfers = useFollowedGolfers(viewerId, business.id);
  const coachEligible = isCoachCategory(business.category);
  const coachQuery = useMyCoach(viewerId, coachEligible);
  const nearby = useBusinessNearbyCounts(business.category, business.lat, business.lng);
  const courses = nearby.data?.courses ?? [];
  const ids = courses.map((c) => c.id);
  const batch = useNearbyCourseStats(viewerId, courses, nearbyEligible);
  const players = golfers.isError ? [] : golfers.data ?? [];
  const hcp = useQuery({
    queryKey: ['business-you-hcp', players.map((p) => p.user_id)],
    enabled: players.length >= 3,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: unknown) => Promise<{ data: unknown; error: unknown }> })
        .rpc('get_visible_handicaps', { p_ids: players.map((p) => p.user_id) });
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of (data ?? []) as Array<{ user_id: string; handicap_index: number | null }>) {
        if (r.handicap_index != null && Number.isFinite(Number(r.handicap_index))) map[r.user_id] = Number(r.handicap_index);
      }
      return map;
    },
  });

  const settled = !golfers.isLoading
    && (!nearbyEligible || (!nearby.isLoading && (ids.length === 0 || !batch.isLoading)))
    && (players.length < 3 || !hcp.isLoading);
  if (!settled) return null;

  const name = business.name;
  const kicker = t('business.you.kicker', { name, defaultValue: 'You and {{name}}' });
  const kickerStyle: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', overflowWrap: 'normal' };
  const F = players.length;
  if (coachEligible) {
    if (!coachQuery.isSuccess || coachQuery.isError) return null;
    if (coachQuery.data?.business_id === business.id) {
      const title = coachSentences(coachQuery.data, name, t);
      const faces = F > 0 ? { players, max: 3, ...followFaces(players, name, tt) } : null;
      return <YouCardShell dataAttr="data-business-you" kicker={kicker} kickerStyle={kickerStyle} first={title.first} second={title.second} faces={faces} />;
    }
  }

  const n = nearby.data?.coursesNear ?? 0;
  if (nearbyEligible && n >= 1 && batch.isSuccess) {
    const facts = nearbyFacts(batch.data);
    if (facts.played === 0 && F === 0) return null;
    const title = nearbyTitle(n, facts, tt);
    const faces = F > 0 ? { players, max: 3, ...followFaces(players, name, tt) } : null;
    return <YouCardShell dataAttr="data-business-you" kicker={kicker} kickerStyle={kickerStyle} first={title.first} second={title.second} faces={faces} />;
  }

  // States C–E (and a nearby place whose course read is unavailable).
  if (F === 0) return null;
  if (F <= 2) {
    const f = followFaces(players, name, tt);
    return <YouCardShell dataAttr="data-business-you" kicker={kicker} kickerStyle={kickerStyle} first={`${f.names}${f.rest}`} faces={null} />;
  }
  const avg = hcp.isSuccess ? averageHcp(players.map((p) => hcp.data[p.user_id])) : null;
  const first = tt('business.you.manyFollow', { n: formatNumber(F), name, defaultValue: '{{n}} golfers you follow follow {{name}}.' });
  const second = avg ? tt('business.you.avgHcp', { avg, defaultValue: 'Their handicaps average {{avg}}.' }) : '';
  const k = F - 2;
  const faces = {
    players, max: 3,
    names: tt('business.you.namesList', { a: players[0].display_name, b: players[1].display_name, defaultValue: '{{a}}, {{b}}' }),
    rest: tt('business.you.andOthers', { n: formatNumber(k), others: others(k, tt), defaultValue: ' and {{n}} {{others}}' }),
  };
  return <YouCardShell dataAttr="data-business-you" kicker={kicker} kickerStyle={kickerStyle} first={first} second={second} faces={faces} />;
}

export interface BusinessYouInput { id: string; name: string; category?: string | null; lat?: number | null; lng?: number | null }

export function BusinessYouCard({ isClub, viewerId, business }: { isClub: boolean; viewerId?: string; business: BusinessYouInput }) {
  if (isClub || !viewerId) return null;
  return <BusinessYouRead key={`${viewerId}:${business.id}`} business={business} viewerId={viewerId} />;
}
