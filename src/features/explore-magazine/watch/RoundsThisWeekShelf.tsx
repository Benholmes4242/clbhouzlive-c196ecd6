import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { analyticsEvents } from '@/utils/analyticsEvents';

import {
  SHELF_CARD,
  SHELF_SKELETON,
  recentSentenceParts,
} from './roundsShelfRules';
import { RoundTileMarks } from './RoundTileMarks';
import { RoundTileFoot, RoundTileWho } from './RoundTileParts';
import './standout-shelf.css';

/**
 * RECENT ROUNDS (RR1, mock A/B) — a shelf on Watch's For you chip, directly
 * after Quick hits. Signed-in members only.
 *
 * One paged read: get_recent_rounds(scope, '14', 10, offset), newest first,
 * ten at a time as the sentinel shows, until total_count rows are loaded and
 * the carousel ends on the final round. Circle first: when the circle settles
 * with fewer than two rounds the shelf re-reads with scope 'everyone' and the
 * sub-line says so. No rounds hides the heading and the rail. An error hides
 * the shelf quietly and logs the way the page's other shelves log.
 */

/** One viewed event per scope per app session (the WhoToFollowRail pattern). */
const VIEWED = new Set<string>();

/** Rows load ten at a time (RR1 §1). */
const RECENT_PAGE = 10;

/** get_recent_rounds returns the StandoutRound shape plus total_count. */
export interface RecentRound extends StandoutRound {
  total_count: number;
}

export function useRecentRounds(userId: string | undefined, scope: 'circle' | 'everyone', enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['explore', 'recent-rounds', scope, userId],
    enabled: enabled && !!userId,
    staleTime: 60_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_recent_rounds' as never, {
        p_scope: scope,
        p_window: '14',
        p_limit: RECENT_PAGE,
        p_offset: pageParam,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as RecentRound[];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length === 0) return undefined;
      const loaded = pages.reduce((n, page) => n + page.length, 0);
      const total = lastPage[0]?.total_count ?? loaded;
      return loaded < total ? loaded : undefined;
    },
  });
}

/** CS1: the course page's own-round amber, name and edge only. */
export const OWN_ROUND_AMBER = '#F7931E';
export const OWN_ROUND_BORDER = 'rgba(247,147,30,0.35)';

/** Shared by Recent rounds and the course page's Lately here (CS1); never fork.
 * EXPLORE TILES A: the same markup and classes as the Standout round tile —
 * standout-card / standout-who / standout-story / standout-bottom / standout-foot.
 * The date lives only in the foot; the sentence is never clamped; the tile
 * grows (minHeight) so the rail stretches every tile to the tallest. */
export function RoundCard({
  round,
  shapes,
  locale,
  onOpenRound,
  onOpenMember,
  here = false,
  inCircle = false,
  own = false,
}: {
  round: StandoutRound;
  shapes: ReturnType<typeof useRoundHoleShapes>;
  locale: string;
  onOpenRound?: (scoreId: string, ownerUserId: string | null) => void;
  onOpenMember?: (userId: string) => void;
  /** CS1: on the course page — "here" sentences, CIRCLE-only second line. */
  here?: boolean;
  inCircle?: boolean;
  own?: boolean;
}) {
  const { t } = useTranslation('courses');
  const shape = round.whs_score_id ? shapes?.get(round.whs_score_id) ?? null : null;
  const sentence = recentSentenceParts(round, locale, here ? { here: true } : undefined);
  return (
    <div
      role="button"
      tabIndex={0}
      data-rounds-shelf-card="round"
      data-own-round={own ? 'true' : undefined}
      className="standout-card"
      onClick={() => {
        if (!round.whs_score_id) return;
        analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'round' });
        onOpenRound?.(round.whs_score_id, round.user_id);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!round.whs_score_id) return;
        analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'round' });
        onOpenRound?.(round.whs_score_id, round.user_id);
      }}
      style={{
        width: SHELF_CARD.width, minHeight: SHELF_CARD.minHeight,
        border: `1px solid ${own ? OWN_ROUND_BORDER : SHELF_CARD.border}`,
      }}
    >
      <RoundTileWho
        userId={round.user_id}
        name={round.display_name || t('discover.aMember', 'A member')}
        photo={round.profile_photo_url}
        course={round.course_name}
        onOpenMember={onOpenMember}
        nameColor={own ? OWN_ROUND_AMBER : undefined}
        circleOnly={here}
        inCircle={inCircle}
      />
      {sentence ? (
        <div className="standout-story">{t(sentence.key, { ...sentence, defaultValue: sentence.defaultValue })}</div>
      ) : null}
      <div className="standout-bottom">{shape ? <RoundTileMarks shape={shape} /> : null}</div>
      <RoundTileFoot round={round} locale={locale} />
    </div>
  );
}

export function RoundsThisWeekShelf({
  userId,
  onOpenRound,
  onOpenMember,
}: {
  userId: string | undefined;
  /** Opens the scorecard sheet Explore already hosts. */
  onOpenRound?: (scoreId: string, ownerUserId: string | null) => void;
  onOpenMember?: (userId: string) => void;
}) {
  const { t, i18n } = useTranslation('courses');
  const locale = i18n.language || 'en';

  const circle = useRecentRounds(userId, 'circle', !!userId);
  /* Fewer than two circle rows re-reads as everyone; the sub-line says so. */
  const circleTotal = circle.data?.pages[0]?.[0]?.total_count ?? circle.data?.pages[0]?.length ?? 0;
  const fellBack = circle.isFetched && circleTotal < 2;
  const everyone = useRecentRounds(userId, 'everyone', !!userId && fellBack);
  const scope: 'circle' | 'everyone' = fellBack ? 'everyone' : 'circle';
  const roundsQ = fellBack ? everyone : circle;

  const rounds = useMemo(() => roundsQ.data?.pages.flat() ?? [], [roundsQ.data]);
  const roundIds = useMemo(() => rounds.map((r) => r.whs_score_id), [rounds]);
  const shapes = useRoundHoleShapes(roundIds);

  const loading = !!userId && (!circle.isFetched || (fellBack && !everyone.isFetched));
  const errored = circle.isError || (fellBack && everyone.isError);
  useEffect(() => {
    if (errored) console.warn('[rounds shelf] read failed; shelf hidden', { circle: circle.isError, everyone: everyone.isError });
  }, [errored, circle.isError, everyone.isError]);

  /* rounds_shelf_viewed — once per session per scope, at 50% visibility. */
  const viewRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = viewRef.current;
    if (!el || rounds.length === 0 || VIEWED.has(scope)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !VIEWED.has(scope)) {
            VIEWED.add(scope);
            analyticsEvents.track('rounds_shelf_viewed', { scope });
            observer.disconnect();
          }
        }
      },
      { threshold: [0.5] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scope, rounds.length]);

  /* RR1 §4 — the sentinel loads the next page as the end nears. */
  const railRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = roundsQ;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const rail = railRef.current;
    if (!sentinel || !rail || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
        }
      },
      { root: rail, rootMargin: '0px 300px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rounds.length]);

  if (!userId) return null;

  if (loading) {
    /* Reserve the heading and one row of two cards; expand outwards only. */
    return (
      <div data-rounds-shelf="loading" aria-hidden>
        <div style={{ padding: '28px 16px 10px' }}>
          <div style={{ height: 19, width: 150, borderRadius: 6, background: A.PANEL }} />
          <div style={{ height: 12, width: 130, borderRadius: 6, background: A.PANEL, marginTop: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: SHELF_CARD.gap, padding: '0 16px', overflow: 'hidden' }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flex: 'none', width: SHELF_CARD.width, height: SHELF_CARD.height, borderRadius: SHELF_CARD.radius, background: A.PANEL }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-rounds-shelf={rounds.length > 0 ? 'ready' : 'empty'}>
      {rounds.length > 0 && !errored ? (
        <>
          <div ref={viewRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '28px 16px 12px' }}>
            <div>
              <b style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>
                {t('amateur.roundsShelf.title', 'Recent rounds')}
              </b>
              <span style={{ display: 'block', fontSize: 12.5, color: A.DIM, marginTop: 2 }}>
                {scope === 'circle'
                  ? t('amateur.roundsShelf.subCircle', 'Your circle, last 14 days')
                  : t('amateur.roundsShelf.subEveryone', 'Everyone, last 14 days')}
              </span>
            </div>
          </div>
          <div
            ref={railRef}
            data-rounds-shelf-rail
            style={{
              display: 'flex', gap: SHELF_CARD.gap, padding: '0 16px', overflowX: 'auto',
              scrollbarWidth: 'none', scrollSnapType: 'x proximity', scrollPaddingInline: 16,
              overscrollBehaviorX: 'contain', willChange: 'transform',
            }}
          >
            {rounds.map((round) => (
              <RoundCard
                key={`round:${round.whs_score_id ?? round.user_id}:${round.play_date}`}
                round={round}
                shapes={shapes}
                locale={locale}
                onOpenRound={onOpenRound}
                onOpenMember={onOpenMember}
              />
            ))}
            {hasNextPage ? <div ref={sentinelRef} data-rounds-shelf-sentinel style={{ flex: 'none', width: 1 }} aria-hidden /> : null}
            {isFetchingNextPage ? (
              <div
                data-rounds-shelf-skeleton
                style={{
                  flex: 'none', width: SHELF_SKELETON.width, height: SHELF_SKELETON.height,
                  borderRadius: SHELF_SKELETON.radius, background: SHELF_SKELETON.background,
                }}
              />
            ) : null}

          </div>
        </>
      ) : null}
    </div>
  );
}

export default RoundsThisWeekShelf;
