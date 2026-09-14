import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { A, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { fetchCircleIds } from '@/lib/social/circle';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreShelf } from './ExploreShelf';
import { ShelfShell } from './ExploreShells';
import { railCaptionDate, relativeDay, toParLabel } from './exploreCopy';
import { circleHandicapDisplay } from './circleHandicap';

/**
 * "YOUR CIRCLE" (BRIEF_EXPLORE_CIRCLE_SHELF) — the latest rounds from the people
 * the viewer follows, NEWEST FIRST.
 *
 * THE ORDER IS CHRONOLOGICAL AND THAT IS DELIBERATE. Every other shelf and the
 * stream itself are RANKED. This one answers a LOOKUP question — "who played
 * yesterday?" — and a lookup question has a right answer, which a relevance
 * ranker will happily bury beneath something more notable from Tuesday. DO NOT
 * "fix" this to match the ranker: sorting it by notability deletes the only
 * question it exists to answer.
 *
 * NO WINDOW. There is no 7- or 14-day cap. The median circle produced ZERO
 * 18-hole rounds in the last 7 days and 17 in the last 30, so a week-long window
 * would leave this rail empty on a normal week. With no window it simply reaches
 * further back and the DATE ON EACH TILE tells the truth — the same reasoning as
 * the backlog lane: visible age beats an empty surface.
 *
 * ONE DEFINITION OF "MY CIRCLE". The rows come from useCircleLatestRounds with
 * scope 'circle', which resolves the follow set through fetchCircleIds in
 * src/lib/social/circle.ts — the same helper the stream's `circle_round`
 * consequence uses. No second definition is introduced here. Suggested
 * (outside-the-circle) fill is OFF: this shelf is about the viewer's own people.
 *
 * NOT THE CLUB. The circle and the club are different sets, so this shelf is not
 * scoped by the My club chip — a member whose friends play elsewhere must still
 * see them.
 *
 * EXCLUDES THE VIEWER'S OWN ROUNDS (includeSelf false, the hook's default) and
 * 18-hole rounds only, consistent with the rest of the page.
 *
 * EMPTY RENDERS NOTHING — no placeholder, no "follow some people" prompt. The
 * People shelf already exists to solve that.
 */

/** §3 the rounds tile geometry named by the brief. */
const TILE = { w: 170, h: 112 };
/** §2 the rail draws ten; the see-all sheet carries the rest. */
const RENDERED = 10;
/** How deep the sheet reads. Newest first, so this is the newest N. */
const SHEET_LIMIT = 60;
/** No window: ten years is "everything we hold" without an unbounded scan. */
const NO_WINDOW_DAYS = 3650;

/**
 * THE REAL TOTAL, so "See all 24 rounds" is a fact and not the length of a page.
 * A head count over the same set the tiles are drawn from: 18-hole rounds by the
 * people the viewer follows, viewer excluded.
 *
 * BOUNDED BY CONSTRUCTION. This used to send ONE `in.(...)` list containing every
 * followed member. On an account that follows most of the platform that URL grew
 * past what PostgREST accepts and the request came back 400 — repeatedly, on
 * every Explore mount, so the count was never a count. The follow set is now cut
 * into fixed slices and the per-slice counts summed, so no single URL can grow
 * with the follow set. It also only runs once the rail has something to label.
 */
const COUNT_CHUNK = 20;

function useCircleRoundTotal(viewerId: string | undefined, ready: boolean) {
  return useQuery({
    queryKey: ['explore-magazine', 'circle-round-total', viewerId ?? 'anon'],
    enabled: !!viewerId && ready,
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const ids = (await fetchCircleIds(viewerId as string)).filter((id) => id !== viewerId);
      if (ids.length === 0) return 0;
      let total = 0;
      for (let i = 0; i < ids.length; i += COUNT_CHUNK) {
        const slice = ids.slice(i, i + COUNT_CHUNK);
        const { count, error } = await supabase
          .from('gam_round_stats')
          .select('whs_score_id', { count: 'exact', head: true })
          .in('user_id', slice)
          .eq('holes_played', 18);
        if (error) throw error;
        total += count ?? 0;
      }
      return total;
    },
  });
}

function toPar(row: CircleRoundRow): number | null {
  return row.gross != null && row.course_par != null ? row.gross - row.course_par : null;
}

export function CircleShelf({
  viewerId,
  pos,
}: {
  viewerId: string | undefined;
  pos: number;
}) {
  const { t } = useTranslation('courses');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [target, setTarget] = useState<{ scoreId: string; userId: string } | null>(null);

  const circle = useCircleLatestRounds(viewerId, {
    limit: SHEET_LIMIT,
    scope: 'circle',
    includeSuggested: false,
    oneRoundPerMember: false,
    allowMultiplePerFriend: true,
    windowDays: NO_WINDOW_DAYS,
  });
  const total = useCircleRoundTotal(viewerId);

  /* NEWEST FIRST, stated here as well as in the hook, because this shelf's
     contract is the order. */
  const rows = useMemo(
    () =>
      (circle.data ?? [])
        .filter((row) => !row.is_self && !row.suggested)
        .slice()
        .sort((a, b) => b.play_date.localeCompare(a.play_date)),
    [circle.data],
  );
  const tiles = useMemo(() => rows.slice(0, RENDERED), [rows]);

  const courseIds = useMemo(
    () => tiles.map((row) => row.course_id).filter((id): id is string => !!id),
    [tiles],
  );
  const meta = useCourseCardMeta(courseIds);

  const open = (row: CircleRoundRow) => {
    analyticsEvents.track('amateur_shelf_tile_tapped', { kind: 'circle', pos });
    if (row.score_id) setTarget({ scoreId: row.score_id, userId: row.user_id });
  };

  if (!viewerId) return null;
  if (!circle.isFetched || !total.isFetched) {
    return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  }
  /* §4 A viewer who follows nobody, or whose circle has no tracked rounds, gets
     NO SHELF. Skipped; the next shelf takes the slot. */
  if (rows.length === 0) return null;

  const shown = Math.max(total.data ?? 0, rows.length);

  return (
    <>
      <ExploreShelf
        heading={t('amateur.stream.shelf.circle', 'Your circle')}
        /* Sentence-case see-all: the horizontal-rail convention. Only where
           there is more than the rail draws. */
        seeAllLabel={
          shown > tiles.length ? t('amateur.stream.seeAllRounds', 'See all {{count}} rounds', { count: shown }) : null
        }
        metaLabel={t('amateur.stream.roundCount', '{{count}} rounds', { count: shown })}
        onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'circle', pos })}
          onSeeAll={() => {
          analyticsEvents.track('amateur_shelf_see_all', { kind: 'circle' });
          setSheetOpen(true);
          }}
        >
        {tiles.map((row) => {
          const course = row.course_id ? meta.data?.get(row.course_id) : null;
          const handicap = circleHandicapDisplay({
            hasActiveConnection: row.has_active_whs_connection,
            handicapVisibility: row.handicap_visibility,
            egVisible: row.eg_visible,
            handicapIndex: row.current_handicap_index,
            /* READ, NEVER DERIVED: gam_round_stats.delta_index, written by
               gam-evaluator for the movement this exact round produced. */
            deltaIndex: row.delta_index,
          });
          return (
            <div
              key={`${row.round_id}`}
              style={{ flex: `0 0 ${TILE.w}px`, width: TILE.w }}
            >
              <StandoutTile
                /* Never the viewer: own rounds are excluded from this shelf. */
                isOwn={false}
                courseId={row.course_id ?? ''}
                /* THE COURSE VARIES HERE AND SO IT IS NAMED. On the club shelf
                   the heading implies the course; on this shelf the course is
                   the information, alongside the player. */
                courseName={row.course_name ?? t('amateur.stream.aCourse', 'a course')}
                imageUrl={course?.imageUrl ?? null}
                region={null}
                photo={TILE.h}
                reserveTwoLines
                /* Gross is the figure and stays white; only the to-par unit
                   takes the under-par red, inside StandoutTile. */
                figure={row.gross != null ? String(row.gross) : null}
                unit={toParLabel(toPar(row)) ?? undefined}
                 /* INTENTIONALLY DIFFERENT FROM STANDING AND CLUB. Those rails
                    place this same railCaptionDate beneath the name. Circle's
                    second caption line belongs to HCP movement, so adding the
                    date there would create a crowded third line. Keep the one
                    app-wide date grammar; the POSITION differs, the MATERIAL
                    does not. The glass date badge is retired: plain kicker text
                    on the photo, as on every other tile. */
                 whenLabel={railCaptionDate(row.play_date) ?? ''}
                who={row.display_name}
                /* IDENTITY IS user_profiles / public_profiles AND NOTHING ELSE.
                   Never whs_friends or whs_friend_matches: those hold England
                   Golf names and photo URLs and leaked once already. */
                avatarUrl={row.profile_photo_url ?? null}
                avatarUserId={row.user_id}
                railCaptionLine={
                  handicap ? (
                    <>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.19em',
                          lineHeight: 1,
                          color: A.DIM,
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('friendsRail.index', 'HCP')} {handicap.index}
                      </span>
                      {handicap.delta ? (
                        <span
                          style={{
                            ...NUMF,
                            marginLeft: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: 9,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: handicap.delta.tone,
                          }}
                        >
                          <span aria-hidden>{handicap.delta.arrow}</span>
                          <span>{handicap.delta.text}</span>
                        </span>
                      ) : null}
                    </>
                  ) : null
                }
                onPress={() => open(row)}
              />
            </div>
          );
        })}
      </ExploreShelf>

      {/* SEE-ALL IS A SHEET, NOT A ROUTE: the member is coming back to the
          stream. Newest first, complete. */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} maxHeight="75dvh">
        <div style={{ fontFamily: SANS, padding: '4px 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>
              {t('amateur.stream.shelf.circle', 'Your circle')}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: A.MUTE }}>
              {t('amateur.stream.roundCount', '{{count}} rounds', { count: shown })}
            </span>
          </div>
          {rows.map((row) => {
            const label = toParLabel(toPar(row));
            return (
              <button
                key={row.round_id}
                type="button"
                onClick={() => open(row)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  border: 0,
                  background: 'transparent',
                  padding: '11px 0',
                  borderTop: `0.5px solid ${A.HAIRLINE}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <SquircleAvatar
                  src={row.profile_photo_url}
                  userId={row.user_id}
                  alt={row.display_name}
                  size={28}
                  hideRing
                />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      color: A.INK,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.display_name}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: A.MUTE }}>
                    {row.course_name ?? t('amateur.stream.aCourse', 'a course')}
                    {' \u00B7 '}
                    {relativeDay(row.play_date) ?? ''}
                  </span>
                </span>
                {row.gross != null ? (
                  <span style={{ ...NUMF, fontSize: 15, color: A.INK }}>
                    {row.gross}
                    {label ? (
                      <span style={{ marginLeft: 5, fontSize: 11, fontWeight: 700, color: A.MUTE }}>
                        {label}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <RoundDetailSheet
        open={!!target}
        onClose={() => setTarget(null)}
        scoreId={target?.scoreId ?? null}
        connectionId={null}
        profileUserId={target?.userId ?? null}
      />
    </>
  );
}

export default CircleShelf;
