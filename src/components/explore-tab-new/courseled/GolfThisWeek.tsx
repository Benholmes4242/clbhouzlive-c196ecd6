import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';


import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import {
  toParFor,
  buildInsightMap,
  referenceLine,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
  INSIGHT_LINE_RESERVE,
  INSIGHT_CLAMP,
  InsightGlyph,
  IndexMovementTriangle,
} from '../friendRoundParts';
import { FIGS } from '@/features/courses/components/holes/analytical/tokens';

import { CourseImageFallback } from './CourseImageFallback';
import { relativeDay } from './discoverWhen';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useRoundHoleShapes, type HoleShape } from './hooks/useRoundHoleShapes';
import { useFollowingIdSet } from './hooks/useFollowingIdSet';
import {
  DEFAULT_WEEK_SCOPE,
  GOLF_WEEK_RAIL_CAP,
  bestOfWeek,
  orderForWeek,
  usePlayedCourseIds,
  useGolfThisWeek,
  useWeekCounts,
  useWeekScopeCourses,
  type WeekScope,
} from './hooks/useGolfThisWeek';
import { useWeekRegionCounts, type RegionSelection } from './hooks/useWeekRegionCounts';
import { RegionDropdown, WeekScopePills, scopeEmptyKey } from './WeekFilters';
import { RoundShape } from './RoundShape';
import { GolfThisWeekRail as GolfThisWeekShell } from './DiscoverCourseLedSkeleton';
import { A, CARD_SHELL, Eyebrow, GOLD, InkAction, KICKER, LABEL, NUMF, SANS } from './tokens';

/**
 * GOLF THIS WEEK (BRIEF_GOLF_THIS_WEEK). Replaces Around the world (standout
 * feats) and Personal bests, both deleted.
 *
 * EVERY ROUND GETS A CARD. There is no feat threshold anywhere in this file:
 * the interest comes from the COURSE (the variable — a member following four
 * people cannot tell the golfers apart, but Royal Birkdale, Broadstone and
 * Quinta do Lago is plainly a varied week), from the relative band at the top,
 * and from the handicap movement every counting round produces.
 *
 * THIS SECTION ASKS "WHERE". The friends rail above asks "WHO" and is untouched.
 *
 * DECORATION RULES:
 *   - The section heading carries the same outline Lucide icon as the other
 *     Discover sections (CalendarDays) — part of a system, no emoji there.
 *   - The band tiles are small celebratory stat tiles; a single emoji marker
 *     before the label is allowed there, like the trophy on the WON chip.
 *   - The only coloured bitmap is the ace/albatross gold marker on a round card.
 *   - Chevrons appear on navigation only.
 */


/* Condensed tile geometry — ~12% shorter than the first pass, with the insight
   line still at one consistent height across the rail. */
const CARD_W = 236;
const PHOTO_H = 92;
const SHAPE_H = 48;

/** The rail scrim of record — imported, never retyped. */
const CARD_SCRIM = SCRIM_STANDOUT;

/** Amber is the viewing member, on their own card border and nowhere else (§7). */
const AMBER = '#F7931E';

/**
 * §6.1 — the shape draws itself once on arrival, ~600ms, the round replaying.
 * ONE easing, taken from the existing draw animations in this feature family
 * rather than a third curve, and expressed as a clip-path sweep so nothing about
 * RoundShape's geometry changes.
 */
const DRAW_MS = 600;
const DRAW_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

function ShapeReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drawn, setDrawn] = useState(false);
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // NOT FOR CARDS OFF SCREEN (§6.1): a rail is horizontally scrolled, so the
    // eighth card must animate when it is reached, not while it is out of view.
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    /* A CURVE MUST NEVER BE PERMANENTLY INVISIBLE. If the observer is starved
       for any reason (clipping, containment, a rail measured at zero), the
       shape reveals itself anyway. */
    const failsafe = window.setTimeout(() => setDrawn(true), 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [reduced]);


  const complete = reduced || drawn;
  /* THE OBSERVED ELEMENT MUST NOT BE THE CLIPPED ELEMENT. A self-clipped node
     (inset(0 100% 0 0)) reports a zero-area intersection rect in Chrome, so the
     observer never fires and the curve stays hidden forever — the defect this
     splits apart. Outer node = measured, inner node = clipped. */
  return (
    <div ref={ref}>
      <div
        style={{
          clipPath: complete ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transition: reduced ? undefined : `clip-path ${DRAW_MS}ms ${DRAW_EASE}`,
        }}
      >
        {children}
      </div>
    </div>
  );

}

/**
 * §2.2 — a REAL follow button, the highest-value tap on the page, and the ONLY
 * <button> inside the tile (the tile itself is a role="button" div, because a
 * button nested in a button is invalid HTML and WebKit swallows the inner tap).
 *
 * IT HOLDS NO STATE, exactly like FeedFollowPill in the Clubhouse card: the
 * truth is the cached following-id set, so optimism survives a remount and
 * every tile for the same member flips together.
 */
function FollowButton({
  targetUserId,
  isFollowed,
  viewerUserId,
}: {
  targetUserId: string;
  isFollowed: boolean;
  viewerUserId: string | undefined;
}) {
  const { t } = useTranslation('courses');
  const queryClient = useQueryClient();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();

  /* THE VIEWER IS THE AUTH USER ID, not a field on the actor. ActiveActor has
     no `userId` — reading it always yielded undefined and useToggleFollow threw
     "missing viewer identity". This is the Clubhouse derivation verbatim
     (FriendsEmptyState): actor id for the ACTOR, auth id for the USER. */
  const viewerActorType = activeActor?.type === 'business' ? 'business' : 'personal';
  const viewerActorId = activeActor?.id ?? viewerUserId;

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (toggle.isPending) return;
      if (!viewerUserId || !viewerActorId) return;

      const key = ['courseled', 'following-ids', viewerUserId] as const;
      const previous = queryClient.getQueryData<Set<string>>(key);
      /* OPTIMISM LIVES IN THE CACHE, not in a local flag. A new Set, so the
         query's referential identity changes and every reader re-renders. */
      queryClient.setQueryData<Set<string>>(key, (old) => {
        const next = new Set(old ?? []);
        if (isFollowed) next.delete(targetUserId);
        else next.add(targetUserId);
        return next;
      });

      toggle.mutate(
        {
          targetActorType: 'personal',
          targetActorId: targetUserId,
          targetUserId,
          viewerActorType,
          viewerActorId,
          viewerUserId,
          isFollowing: isFollowed,
        },
        {
          /* ROLL BACK to exactly what was there before the tap, and SAY SO. */
          onError: () => {
            if (previous) queryClient.setQueryData<Set<string>>(key, new Set(previous));
            else void queryClient.invalidateQueries({ queryKey: ['courseled', 'following-ids'] });
            toast.error('Could not update follow status. Please try again.');
          },
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['courseled', 'following-ids'] });
          },
        },
      );
    },
    [
      isFollowed,
      queryClient,
      targetUserId,
      toggle,
      viewerActorId,
      viewerActorType,
      viewerUserId,
    ],
  );


  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isFollowed ? 'Unfollow' : 'Follow'}
      style={{
        ...LABEL,
        flexShrink: 0,
        fontFamily: SANS,
        color: isFollowed ? A.MUTE : A.PANEL,
        background: isFollowed ? 'transparent' : A.INK,
        border: `1px solid ${isFollowed ? A.BORDER : A.INK}`,
        borderRadius: 999,
        padding: '5px 10px',
        cursor: 'pointer',
      }}
    >
      {isFollowed
        ? t('discover.golfThisWeek.following', 'FOLLOWING')
        : t('discover.golfThisWeek.follow', 'FOLLOW')}
    </button>
  );
}

interface CardProps {
  row: CircleRoundRow;
  shape: HoleShape | null;
  insight: string | null;
  courseName: string | null;
  region: string | null;
  imageUrl: string | null;
  showFollow: boolean;
  /** §2.2 — read from the SAME cached following-id set that drives showFollow. */
  isFollowed: boolean;
  viewerUserId: string | undefined;
  onPress: () => void;
}

/**
 * THE CARD LEADS WITH THE COURSE (§2). Order is fixed: course image and name /
 * gross and to-par with the index movement right-aligned / player row / the
 * shape / the insight line.
 */
function GolfThisWeekCard({
  row,
  shape,
  insight,
  courseName,
  region,
  imageUrl,
  showFollow,
  isFollowed,
  viewerUserId,
  onPress,
}: CardProps) {
  const { t } = useTranslation('courses');
  const toPar = toParFor(row);
  /* §6.3 — the ONLY marker on this section, and only for these two feats. */
  const legendary = (row.holes_in_one ?? 0) > 0 || (row.albatrosses ?? 0) > 0;
  /* §1.3 / §7 — THIS round's index movement. delta_index is stored and has never
     been shown; improved is GREEN and drifted RED because a movement's axis is
     direction of travel, not golf quality. Exactly zero is a real answer and
     renders with no colour claim. */
  const delta = row.delta_index;
  const hasDelta = delta != null && Number.isFinite(delta);
  const deltaZero = hasDelta && Math.abs(delta as number) < 0.05;
  const deltaTone = deltaZero ? A.MUTE : (delta as number) < 0 ? A.IMPROVED : A.DRIFTED;

  return (
    /* NOT A <button> (§S1.1): FollowButton is a real button and a button inside
       a button is invalid HTML — WebKit commonly never delivers the inner tap.
       Div + role="button" + Enter/Space keeps the whole tile operable. */
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          onPress();
        }
      }}
      style={{
        ...CARD_SHELL,
        border: `1px solid ${A.BORDER}`,
        width: CARD_W,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      <CourseImageFallback
        courseId={row.course_id}
        courseName={courseName ?? row.course_name}
        imageUrl={imageUrl}
        style={{ height: PHOTO_H, flexShrink: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0, background: CARD_SCRIM }} />
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8 }}>
          <div
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
            }}
          >
            {courseName ?? row.course_name ?? t('discover.golfThisWeek.unknownCourse', 'A course')}
          </div>
          <div
            style={{
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10.5,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.82)',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {region ?? ''}
            </span>
            <span style={{ opacity: 0.7 }}>{relativeDay(row.play_date, t)}</span>
          </div>
        </div>
      </CourseImageFallback>

      <div style={{ padding: '9px 11px 9px' }}>
        {/* GROSS AND TO-PAR, with index movement right-aligned (§2.1).
            The follow button sits on the same row as the score, not the member
            name, so the highest-value action is visible at the top of the tile. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              ...NUMF,
              fontSize: 24,
              lineHeight: 1,
              color: A.INK,
            }}
          >
            {row.gross ?? '\u2014'}
          </span>
          {toPar && (
            <span style={{ ...NUMF, fontSize: 12.5, color: toPar.tone, lineHeight: 1 }}>
              {toPar.text}
            </span>
          )}
          {legendary && (
            <span style={{ ...LABEL, color: GOLD }}>
              {(row.holes_in_one ?? 0) > 0
                ? t('discover.golfThisWeek.ace', 'ACE')
                : t('discover.golfThisWeek.albatross', 'ALBATROSS')}
            </span>
          )}
          {hasDelta && (
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 3,
                flexShrink: 0,
              }}
            >
              {!deltaZero && (
                <IndexMovementTriangle
                  direction={(delta as number) < 0 ? 'down' : 'up'}
                  color={deltaTone}
                  size={7}
                />
              )}
              <span style={{ ...NUMF, fontSize: 12, color: deltaTone, lineHeight: 1 }}>
                {Math.abs(delta as number).toFixed(1)}
              </span>
              <span style={{ ...LABEL, color: A.DIM }}>
                {t('discover.friendsRail.index', 'HCP')}
              </span>
            </span>
          )}
          {showFollow && (
            <span style={{ marginLeft: hasDelta ? 8 : 'auto', flexShrink: 0, display: 'inline-flex' }}>
              <FollowButton
                targetUserId={row.user_id}
                isFollowed={isFollowed}
                viewerUserId={viewerUserId}
              />
            </span>
          )}
        </div>

        {/* THE PLAYER IS SECONDARY, beneath the score (§2). */}
        <div
          style={{
            marginTop: 7,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            minWidth: 0,
          }}
        >
          {/* THE AVATAR IS THE FRIENDS RAIL'S AVATAR: 20px, no ring (§7). */}
          <SquircleAvatar
            src={row.profile_photo_url}
            userId={row.user_id}
            alt={row.display_name}
            size={20}
            hideRing
          />

          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: row.is_self ? AMBER : A.BODY,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.display_name}
          </span>
        </div>

        {/* THE SHAPE — the friends rail's band, same height, full bleed (§4.1). */}
        <div style={{ marginTop: 6, marginLeft: -11, marginRight: -11 }}>
          <ShapeReveal>
            <RoundShape row={row} shape={shape} width={CARD_W} height={SHAPE_H} showMeta={false} />
          </ShapeReveal>
        </div>


        {/* THE SUBLINE IS THE FRIENDS RAIL'S SUBLINE (§4.2): same glyph, same
            figure font, same body ink, ONE line of reserved height. Aligned to
            the bottom of the reserve so the gap lives above the line, not below
            it, and every tile's line sits at the same height. */}
        <div
          style={{
            minHeight: INSIGHT_LINE_RESERVE,
            marginTop: 4,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          {insight && (
            <div
              style={{
                ...FIGS,
                fontSize: INSIGHT_FONT_SIZE,
                lineHeight: INSIGHT_LINE_HEIGHT,
                fontWeight: 600,
                color: A.BODY,
                ...INSIGHT_CLAMP,
              }}
            >
              <span style={{ display: 'inline' }}>
                <InsightGlyph />
                {insight}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  userId: string | undefined;
  /** THE ONE ROUNDS SECTION (§S1): scope and region are owned above, so the
   *  see-all sheet inherits exactly what the rail is showing. */
  scope?: WeekScope;
  onScopeChange?: (s: WeekScope) => void;
  region?: RegionSelection | null;
  onRegionChange?: (sel: RegionSelection | null) => void;
  onCardPress: (r: CircleRoundRow) => void;
  onSeeAll: () => void;
  style?: React.CSSProperties;
}

export function GolfThisWeek({
  userId,
  scope = DEFAULT_WEEK_SCOPE,
  onScopeChange,
  region = null,
  onRegionChange,
  onCardPress,
  onSeeAll,
  style,
}: Props) {
  const { t } = useTranslation('courses');
  /* THE SCOPE FILTERS AT THE QUERY (§E): Top 100 and Played resolve to a course
     allow-list that goes into SQL. `undefined` means not yet resolved. */
  const scopeCourses = useWeekScopeCourses(userId, scope);
  const roundsQuery = useGolfThisWeek(userId, scope, scopeCourses.courseIds);
  const all = roundsQuery.data ?? [];

  const courseIds = useMemo(
    () => all.map((r) => r.course_id).filter((v): v is string => !!v),
    [all],
  );
  const played = usePlayedCourseIds(userId);
  const playedSet = useMemo(() => new Set(played.ids), [played.ids]);
  const following = useFollowingIdSet(userId);

  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;

  /* COUNTS RESPECT THE ACTIVE PILL (§S3.6): the region list is grouped from the
     rounds THIS scope returned, and needs no query of its own (§S3.7). */
  const regions = useWeekRegionCounts(all, meta);
  const inRegion = useMemo(
    () => all.filter((r) => regions.matches(r, region)),
    [all, regions, region],
  );

  const ordered = useMemo(() => orderForWeek(inRegion, playedSet), [inRegion, playedSet]);
  const counts = useWeekCounts(ordered);
  const best = useMemo(() => bestOfWeek(ordered), [ordered]);
  const rows = useMemo(() => ordered.slice(0, GOLF_WEEK_RAIL_CAP), [ordered]);

  /* ONE batched hole-shape read for the whole rail — never one per card. */
  const scoreIds = useMemo(() => rows.map((r) => r.score_id), [rows]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  /* §4.2 — the insight map is resolved for the WHOLE rail so buildInsightMap's
     repetition cap can see its neighbours. Never per card. */
  const insights = useMemo(() => buildInsightMap(rows, t as never), [rows, t]);

  const pending = !!userId && (roundsQuery.isPending || !scopeCourses.ready);
  if (pending) return <GolfThisWeekShell />;

  const bestToPar = best == null ? null : best.toPar === 0
    ? 'E'
    : best.toPar < 0
      ? `\u2212${Math.abs(best.toPar)}`
      : `+${best.toPar}`;
  const courseNameFor = (r: CircleRoundRow) =>
    meta?.get(r.course_id ?? '')?.name ?? r.course_name ?? '';

  /* THE BAND IS FOUR COMPARISONS OF EQUAL WEIGHT (§2) — tiles, not a sentence
      with footnotes. Each is self-contained: label, figure, who, where.

      BIGGEST MOVE WAS DELETED (reducer and tile) because it returned the same
      round as MOST IMPROVED whenever the largest absolute delta_index was a cut,
      which is roughly half of all weeks. "Biggest rise" would always be distinct
      but would put a member's worst week on Discover.

      BEST STABLEFORD is the reason the band is worth a data change: gross is won
      by the same two or three low handicappers every week, Stableford is NET, so
      the whole membership can enter. It is not `net` — net is ruined by one
      blow-up hole, Stableford charges that hole and nothing more.

      TIES GO TO THE MOST RECENT ROUND in every tile: `ordered` is lens-ordered,
      not date-ordered, so recency is compared explicitly rather than relying on
      a reducer keeping its first-seen row.

      All four tiles carry a marker. They are four comparisons of EQUAL WEIGHT,
      so marking some and not others reads as an omission rather than as emphasis.
      A SECTION HEADING glyph is part of a system — outline lucide icons in ink
      across every Discover section — and an emoji there would be the only
      coloured bitmap among them. */

  /* Each tile is strictly the top of its own category. One member CAN hold
     several — a good round is low gross, high Stableford and birdie-rich at
     once. Deduping by member was rejected: showing second place in a tile
     labelled 'best' is a bug to the member who actually holds it. */
  const newer = (a: CircleRoundRow, b: CircleRoundRow) =>
    String(a.play_date).localeCompare(String(b.play_date)) > 0;

  const withDelta = ordered.filter(
    (r) => r.delta_index != null && Number.isFinite(r.delta_index),
  );
  const mostImproved = withDelta.reduce<CircleRoundRow | null>((acc, r) => {
    const d = r.delta_index as number;
    if (d >= 0) return acc;
    if (!acc) return r;
    const cur = acc.delta_index as number;
    if (d < cur) return r;
    if (d === cur && newer(r, acc)) return r;
    return acc;
  }, null);

  /* NULL STABLEFORD FAILS THE FILTER, never contributes a 0 (§1.3). FLOOR 36 —
     the par-equivalent every club golfer knows. */
  const bestStableford = ordered.reduce<CircleRoundRow | null>((acc, r) => {
    const p = r.stableford_points;
    if (p == null || !Number.isFinite(p) || p < 36) return acc;
    if (!acc) return r;
    const cur = acc.stableford_points as number;
    if (p > cur) return r;
    if (p === cur && newer(r, acc)) return r;
    return acc;
  }, null);

  /* FLOOR 3 — "1 birdie" is not a comparison, and a two-way tie on 1 is worse. */
  const mostBirdies = ordered.reduce<CircleRoundRow | null>((acc, r) => {
    const b = r.birdies;
    if (b == null || !Number.isFinite(b) || b < 3) return acc;
    if (!acc) return r;
    const cur = acc.birdies as number;
    if (b > cur) return r;
    if (b === cur && newer(r, acc)) return r;
    return acc;
  }, null);

  const bandTiles: {
    key: string;
    emoji?: string;
    label: string;
    figure: string;
    tone: string;
    row: CircleRoundRow;
    sub: string;
  }[] = [];

  if (best) {
    bandTiles.push({
      key: 'best',
      emoji: '\uD83D\uDD25', // FIRE
      label: t('discover.golfThisWeek.bestLabel', 'BEST THIS WEEK'),
      figure: String(best.row.gross ?? '\u2014'),
      tone: best.toPar < 0 ? TOPAR_RED : A.INK,
      row: best.row,
      sub: `${bestToPar ?? ''} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(best.row)}`.trim(),
    });
  }
  if (bestStableford) {
    bandTiles.push({
      key: 'stableford',
      emoji: '\uD83C\uDFAF', // DIRECT HIT / DART BOARD
      label: t('discover.golfThisWeek.stablefordLabel', 'Best stableford'),
      figure: String(bestStableford.stableford_points),
      tone: A.INK,
      row: bestStableford,
      sub: `${t('discover.golfThisWeek.stablefordUnit', 'points')} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(bestStableford)}`,
    });
  }
  if (mostBirdies) {
    bandTiles.push({
      key: 'birdies',
      emoji: '\uD83D\uDC26', // BIRD
      label: t('discover.golfThisWeek.birdiesLabel', 'Most birdies'),
      figure: String(mostBirdies.birdies),
      tone: A.INK,
      row: mostBirdies,
      sub: `${t('discover.friendsRail.birdies', 'birdies')} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(mostBirdies)}`,
    });
  }
  if (mostImproved) {
    const d = mostImproved.delta_index as number;
    bandTiles.push({
      key: 'improved',
      emoji: '\uD83D\uDCAA', // FLEXED ARM
      label: t('discover.golfThisWeek.improvedLabel', 'MOST IMPROVED'),
      figure: `\u2212${Math.abs(d).toFixed(1)}`,
      tone: A.IMPROVED,
      row: mostImproved,
      sub: `${t('discover.friendsRail.index', 'HCP')} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(mostImproved)}`,
    });
  }



  return (
    <section style={style}>
      {/* HEADER CONSTRUCTION: heading left, live count right-aligned on the
          SAME line. The "See all" action lives under the first card, not here. */}
      <Eyebrow
        icon={CalendarDays}
        subline={t(
          'discover.golfThisWeek.subline',
          "Everywhere clbhouz golfers played, and how it went."
        )}
        aside={
          <span style={{ ...KICKER, color: A.MUTE }}>
            {t('discover.golfThisWeek.count', '{{rounds}} rounds \u00B7 {{courses}} courses', {
              rounds: counts.rounds,
              courses: counts.courses,
            })}
          </span>
        }
      >
        {t('discover.golfThisWeek.heading', 'Golf this week')}
      </Eyebrow>



      {/* SCOPE PILLS AND THE AREA DROPDOWN — one row, this section's own (§S2/§S3). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          minWidth: 0,
        }}
      >
        <WeekScopePills scope={scope} onChange={(s) => onScopeChange?.(s)} style={{ flex: 1 }} />
        <RegionDropdown
          regions={regions}
          selection={region}
          onChange={(sel) => onRegionChange?.(sel)}
        />
      </div>

      {/* AN HONEST EMPTY ANSWER (§S2.5): the filters stay, the sentence explains. */}
      {rows.length === 0 && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: A.MUTE,
            fontFamily: SANS,
            padding: '10px 0 4px',
          }}
        >
          {t(scopeEmptyKey(scope).key, scopeEmptyKey(scope).fallback)}
        </div>
      )}

      {bandTiles.length > 0 && (
        <div
          className="scrollbar-hide"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            marginBottom: 12,
          }}
        >
          {bandTiles.map((tile) => (
            <div
              key={tile.key}
              style={{
                ...CARD_SHELL,
                /* FOUR TILES DO NOT SHRINK (§3.1): the figure is the content, so
                   the band scrolls at 320px instead. With one, two or three the
                   basis grows and the row fills the width. */
                flex: '1 0 148px',
                minWidth: 148,
                padding: '9px 10px 10px',
                fontFamily: SANS,
              }}
            >
              <div
                style={{
                  ...LABEL,
                  color: A.MUTE,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                <span style={{ lineHeight: 1 }}>{tile.emoji}</span>
                {tile.label}
              </div>

              <div
                style={{
                  ...NUMF,
                  marginTop: 4,
                  fontSize: 22,
                  lineHeight: 1,
                  color: tile.tone,
                }}
              >
                {tile.figure}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <SquircleAvatar
                  src={tile.row.profile_photo_url}
                  userId={tile.row.user_id}
                  alt={tile.row.display_name}
                  size={20}
                  hideRing
                />
                <span
                  style={{
                    minWidth: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: A.BODY,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tile.row.display_name}
                </span>
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: A.MUTE,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {tile.sub}
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Cards only in the horizontal rail; the See-all action sits below the
          first card in a fixed position and does NOT scroll with the carousel. */}
      <div
        className="scrollbar-hide"
        style={{ display: 'flex', alignItems: 'stretch', gap: 10, overflowX: 'auto' }}
      >
        {rows.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          return (
            <GolfThisWeekCard
              key={r.round_id}
              row={r}
              shape={holeShapes?.get(r.score_id ?? '') ?? null}
              insight={insights.get(r.round_id)?.text ?? referenceLine(r, t)}
              courseName={m?.name ?? r.course_name}
              region={m?.region ?? null}
              imageUrl={m?.imageUrl ?? null}
              /* §2.2 — never on the member's own round, never on someone already
                 followed, and never before the follow set has resolved. */
              showFollow={!r.is_self && !!userId && !!following.data}
              isFollowed={!!following.data?.has(r.user_id)}
              viewerUserId={userId}
              onPress={() => onCardPress(r)}
            />
          );
        })}
      </div>

      {counts.rounds > rows.length && (
        <div style={{ marginTop: 8, width: CARD_W }}>
          <InkAction onClick={onSeeAll}>
            {t('discover.golfThisWeek.seeAll', 'See all {{count}} rounds', {
              count: counts.rounds,
            })}
          </InkAction>
        </div>
      )}

    </section>
  );
}

export default GolfThisWeek;
