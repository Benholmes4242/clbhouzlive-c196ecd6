import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useDiscoverLastSeen,
  useMarkDiscoverSeenOnExit,
} from '@/hooks/useDiscoverLastSeen';
import { useExploreLens, type ExploreLens } from './hooks/useExploreLens';

import { useDiscoverWire, type WireEvent } from './hooks/useDiscoverWire';
import { ScopePills } from './wire/ScopePills';
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import GlassHeaderPlate from '@/components/chrome/GlassHeaderPlate';
import { useDiscoverPrompt } from './courseled/hooks/useDiscoverPrompt';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { FriendsRoundsSeeAllSheet } from './FriendsRoundsSeeAllSheet';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import { FriendsPlayedRail } from './courseled/FriendsPlayedRail';
import { OneThingRow } from './courseled/OneThingRow';
import { FindGolfersSheet } from './FindGolfersSheet';
import { GolfThisWeek } from './courseled/GolfThisWeek';
import { GolfThisWeekSheet } from './GolfThisWeekSheet';


import { MomentsOfTheWeek } from './courseled/MomentsOfTheWeek';
import { ClipsRail, LatestVideosRail } from './courseled/CommunityMediaRails';
import { useCommunityVideos } from './courseled/hooks/useCommunityVideos';
import { MostPlayedLeaderboard } from './courseled/MostPlayedLeaderboard';
import { MostPlayedSheet } from './courseled/MostPlayedSheet';

import {
  HonoursBoard,
  sortHonours,
  type HonoursLeader,
  type HonoursMode,
} from './courseled/HonoursBoard';
import { HonoursBoardSheet } from './courseled/HonoursBoardSheet';
import { useMomentsOfTheWeek, type Moment } from './courseled/hooks/useMomentsOfTheWeek';
import { useFriendIdSet } from './courseled/hooks/useFriendIdSet';
import {
  useCommunityCreators,
  type CommunityCreator,
} from './courseled/hooks/useCommunityCreators';
import { useUserStatsCourseMap } from '@/contexts/UserStatsCoursesContext';
import { useMostPlayedThisWeek, type MostPlayedRow } from './courseled/hooks/useMostPlayedThisWeek';
import { buildMomentQueue } from '@/features/community/momentQueue';

/**
 * Discover, COURSE-LED (BRIEF_DISCOVER_REBUILT_COURSE_LED).
 *
 * The page flips from person-led to course-led: every story is framed "at this
 * course, this is what happened". The course card is the atom — image, dark
 * scrim, name and region, a when-chip, event lines stacked beneath.
 *
 * Vertical space is curated and capped; horizontal rails absorb volume, so a
 * heavy week grows sideways rather than pushing the discovery feed off screen.
 * SEVEN sections, seven different anatomies — rail, facts rail, mosaic, feed,
 * mosaic, leaderboard, board. THIS LIST IS THE RENDER ORDER; the previous
 * comment documented six with "Around the world" second, which the code had
 * never matched.
 *
 *   TOP SLOT: Rate nudge when available, otherwise Your Circle
 *   1 Your Circle                 rail        (hidden when promoted to top slot)
 *   2 On tour this week           facts rail  (next-up fallback off-week)
 *   3 Latest reviews              mosaic
 *   4 Around the world            feed        region pills live here
 *   5 From the community          mosaic      read-only viewer
 *   6 Most played this week       leaderboard
 *   7 The honours board           board       never windowed
 *
 * The "This week on clbhouz" pulse band from the signed-off mock is REMOVED per
 * the brief and must not be reinstated.
 */

interface ExploreTabContentProps {
  embedded?: boolean;
  shellTabs?: React.ReactNode;
}

export default function ExploreTabContent({
  embedded: _embedded = false,
  shellTabs,
}: ExploreTabContentProps) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;

  // NEW SINCE (BRIEF_DISCOVER_NEW_SINCE): one baseline for the whole visit,
  // written back only on EXIT so markers survive scrolling and tapping.
  const { lastSeen, markSeen } = useDiscoverLastSeen(userId);
  const { course: nudgeCourse, loading: nudgeLoading } = useRateNudgeCourse(userId);
  const showRateNudge = nudgeLoading || !!nudgeCourse;

  useMarkDiscoverSeenOnExit(markSeen);

  const { lens, setLens } = useExploreLens();

  // Sticky-bar veil: mirrors CoursesContent so the notch strip paints the
  // moment the pills pin (no gap, no colour seam).
  const lensSentinelRef = useRef<HTMLDivElement | null>(null);
  const [tabsStuck, setTabsStuck] = useState(false);
  useEffect(() => {
    setTabsStuck(window.scrollY > 200);
    const el = lensSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setTabsStuck(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The pool is unchanged: ONE 90-day fetch, worldwide. The lenses are
  // client-side filters and ordering over data already loaded.
  const { events: pool, legendary, isPending: wireLoading } = useDiscoverWire(
    null,
    userId,
    crownCategoryLabel,
  );

  const momentsQuery = useMomentsOfTheWeek();
  const moments = momentsQuery.data;
  // THE MEDIA RAILS ARE NOT COURSE-LED (BRIEF_DISCOVER_MEDIA_RAILS §0.2): this
  // reads the whole media library, unfiltered by course tag and by `lens`.
  const communityVideos = useCommunityVideos();
  const mostPlayedQuery = useMostPlayedThisWeek();

  const mostPlayed = mostPlayedQuery.data;

  const [friendsSheet, setFriendsSheet] = useState(false);
  const [golfWeekSheet, setGolfWeekSheet] = useState(false);
  const [findGolfers, setFindGolfers] = useState(false);
  const [mostPlayedSheet, setMostPlayedSheet] = useState(false);
  const [honoursSheet, setHonoursSheet] = useState(false);
  const [honoursMode, setHonoursMode] = useState<HonoursMode>('recent');
  const [honoursFocus, setHonoursFocus] = useState<string | null>(null);

  /**
   * LATEST REVIEWS LEFT THIS PAGE (BRIEF_REVIEWS_TO_COURSES_AND_TOUR_REMOVAL
   * S2). The section, its pool hook and the see-all trigger are all gone from
   * Discover; LatestReviewsSheet itself is untouched and is now opened from the
   * Courses browse, where the review pool is country/region scoped.
   */

  const momentList = useMemo(() => moments ?? [], [moments]);
  // PAGE mosaic: one tile per course. The sheet keeps the full ranked list.
  const momentMosaic = useMemo(() => momentList.filter((m) => m.isCourseLead), [momentList]);

  // === CREATOR CARDS (BRIEF_COMMUNITY_CREATOR_CARDS) ======================
  // Aggregated CLIENT-SIDE over the pool the section already holds. Both inputs
  // to the relevance order are already-cached reads: the friend id set (the
  // same query Around the world uses) and the member's played-course map from
  // the stats context. No new query, no per-card fetch.
  const friendIdsQuery = useFriendIdSet(userId);
  const playedCourseMap = useUserStatsCourseMap();
  const playedCourseIds = useMemo(
    () => new Set(playedCourseMap.keys()),
    [playedCourseMap],
  );
  const creators = useCommunityCreators({
    pool: momentList,
    viewerId: userId,
    friendIds: friendIdsQuery.data,
    playedCourseIds,
  });
  const mostPlayedList = useMemo(() => mostPlayed ?? [], [mostPlayed]);

  const handleLensChange = useCallback(
    (next: ExploreLens) => {
      if (next === lens) return;
      analyticsEvents.track('discover_lens_change', { lens: next });
      // NO scroll: the lens is a client-side filter over an already-fetched
      // pool, so the cards change under the member's scroll position.
      setLens(next);
    },
    [lens, setLens],
  );

  /**
   * THE LENS MACHINERY MOVED INTO THE SECTION (BRIEF_GOLF_THIS_WEEK §3). The
   * pool filters, priority ordering, shortlist overlay and lens empty copy all
   * belonged to Around the world, which is deleted; Golf this week resolves its
   * own membership sets over the course ids of the rounds it actually holds, and
   * the pills are rendered into it. `useDiscoverWire` survives here only for the
   * honours board's `legendary` list.
   */

  // Every course-led surface ROUTES to the course page: it is a different
  // surface with its own job. Sheets are only for bounded sets.
  const goCourse = useCallback(
    (courseId: string, section: string) => {
      analyticsEvents.track('discover_course_card_tapped', { course_id: courseId, section });
      navigate(`/courses/${courseId}`);
    },
    [navigate],
  );

  const opener = useScorecardOpener();
  const handleFriendCard = useCallback(
    (r: CircleRoundRow) => {
      analyticsEvents.track('discover_friend_round_tapped', {
        course_id: r.course_id ?? null,
        has_score: !!r.score_id,
        // BRIEF_WHOS_BEEN_PLAYING 5.1 — is a stranger's round ever opened?
        suggested: r.suggested,
      });
      if (r.score_id) opener.openByScore(r.score_id, r.connection_id, r.user_id);
      else if (r.course_id) navigate(`/courses/${r.course_id}`);
      else opener.openProfile(r.user_id);
    },
    [navigate, opener],
  );



  // Both surfaces (mosaic + sheet) share this handler, so the tapped media's
  // identity must travel with the post — otherwise every tile of a multi-media
  // post opens the post's first media, and swiping onto that post in the viewer
  // shows a photo instead of the clip that earned the tile (no autoplay). The
  // queue leads each post with its best-ranked moment's media.
  const momentPosts = useMemo(() => buildMomentQueue(momentList), [momentList]);

  const handleMoment = useCallback(
    (m: Moment) => {
      analyticsEvents.track('discover_moment_tapped', {
        course_id: m.courseId,
        post_id: m.post.id,
        media_index: m.mediaIndex ?? 0,
      });
      const index = Math.max(
        0,
        momentPosts.findIndex((p) => p.id === m.post.id),
      );
      openWithOrigin({
        posts: momentPosts,
        index,
        originEl: null,
        posterUrl: m.thumbnail,
        mediaIndex: m.mediaIndex ?? 0,
        mediaId: m.mediaId ?? null,
        openedFrom: 'discover-moments',
      });
    },
    [momentPosts],
  );


  // THE WHOLE CARD OPENS THE VIEWER, seeded with that member's moments. Same
  // path handleMoment uses, with a creator-scoped list passed to it. Discover
  // is social browse, so the viewer carries its full action rail.
  const handleCreator = useCallback(
    (c: CommunityCreator) => {
      analyticsEvents.track('discover_creator_card_tapped', {
        creator_id: c.userId,
        clips: c.clips,
        photos: c.photos,
      });
      const posts = buildMomentQueue(c.moments);
      openWithOrigin({
        posts,
        index: 0,
        originEl: null,
        posterUrl: c.frame.thumbnail,
        mediaIndex: c.frame.mediaIndex ?? 0,
        mediaId: c.frame.mediaId ?? null,
        openedFrom: 'discover-moments',
      });
    },
    [],
  );

  const handleMostPlayed = useCallback(
    (r: MostPlayedRow) => goCourse(r.courseId, 'most_played'),
    [goCourse],
  );

  const honours = useMemo(() => sortHonours(legendary), [legendary]);

  const handleHonoursRow = useCallback(
    (e: WireEvent) => {
      analyticsEvents.track('discover_honours_row_tap', {
        kind: e.kind,
        year: new Date(e.at).getFullYear(),
        course_id: e.courseId ?? null,
      });
      if (e.scoreId) opener.openByScore(e.scoreId, null, e.userId);
    },
    [opener],
  );

  const openHonoursSheet = useCallback(() => {
    analyticsEvents.track('discover_honours_sheet_open', { total: honours.length });
    setHonoursMode('recent');
    setHonoursFocus(null);
    setHonoursSheet(true);
  }, [honours.length]);

  /* BRIEF_HONOURS_BOARD_REBUILD §1.9 — a leader card's "{{n}} more" opens the
     SHEET in LEADERS mode, scrolled to that member. Nothing is hidden. */
  const openHonoursLeader = useCallback((leader: HonoursLeader) => {
    analyticsEvents.track('discover_honours_sheet_open', {
      total: leader.total,
      source: 'leader_more',
    });
    setHonoursMode('leaders');
    setHonoursFocus(leader.userId);
    setHonoursSheet(true);
  }, []);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100vh', fontFamily: SANS, ...FIGS }}>
      <div>{shellTabs}</div>

      <GlassHeaderPlate visible={tabsStuck} />
      <div ref={lensSentinelRef} style={{ height: 1 }} aria-hidden />

      {/* The chrome island floats over the page, so the header clears the notch
          plus the island itself — Discover no longer sits under a hero.
          The title block is replaced by the rate nudge when a course is
          available; otherwise Your Circle (friends rail) owns this spot. */}
      <div
        style={{
          padding: '0 14px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)',
        }}
      >
        {showRateNudge ? (
          <RateNudge
            userId={userId ?? ''}
            onEmptyFallback={() => navigate('/courses')}
          />
        ) : (
          <FriendsPlayedRail
            userId={userId}
            lastSeen={lastSeen}
            onCardPress={handleFriendCard}
            onSeeAll={() => setFriendsSheet(true)}
          />
        )}
      </div>



      {/* ONE THING (BRIEF_DISCOVER_ONE_THING): one row, one action, session
          dismissible. Renders nothing when there is nothing to ask. */}
      <OneThingRow userId={userId} onFindGolfers={() => setFindGolfers(true)} />

      {/* ONE SECTION RHYTHM: 28px between a section's content and the next
          section's eyebrow. Eyebrows own their own 10px to their content. */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* The first three sections share a tighter 10px rhythm so the gap from
            the bottom of a rail tile to the next section's eyebrow matches the
            gap from the previous tile's bottom to the current eyebrow. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {showRateNudge && (
            <FriendsPlayedRail
              userId={userId}
              lastSeen={lastSeen}
              onCardPress={handleFriendCard}
              onSeeAll={() => setFriendsSheet(true)}
            />
          )}


          {/* LATEST VIDEOS. ON TOUR THIS WEEK left this page
              (BRIEF_REVIEWS_TO_COURSES_AND_TOUR_REMOVAL S1): it was the only
              section here that is not about the member's world, and its content
              already owns a bottom-nav tab, so it duplicated a top-level
              destination. The component and its hook are intact — unmounted, not
              deleted. LATEST REVIEWS left too (S2), moved to the Courses browse
              where a review is decision content rather than entertainment.
              NOTHING MOVED UP to fill either gap. */}
          {/* The 10px section rhythm reads TIGHT here because the tile above
              ends on a hard card edge, while the gap BELOW this rail is padded
              by the caption's line box. +16px matches the two optically. */}
          <LatestVideosRail
            items={communityVideos.data?.videos ?? []}
            onTilePress={() => navigate('/community')}
            onSeeAll={() => navigate('/community')}
            style={{ marginTop: 16 }}
          />



          <GolfThisWeek
            userId={userId}
            lens={lens}
            /* THE PILLS BELONG TO THIS SECTION NOW (§3). NO WRAPPER DIV: they
               are position:sticky and a wrapper of their exact height becomes
               their containing block, giving them zero travel. */
            pills={
              <ScopePills
                lens={lens}
                onChange={handleLensChange}
                style={{ margin: '2px -14px 14px' }}
              />
            }
            onCardPress={handleFriendCard}
            onSeeAll={() => setGolfWeekSheet(true)}
            style={{ marginTop: 24 }}
          />
        </div>

        {/* CLIPS — after Around the world, before Personal bests. It reads the
            whole library, so the scope pills (which live inside Around the
            world's own subtree) do not and must not filter it. */}
        <ClipsRail
          items={communityVideos.data?.clips ?? []}
          onTilePress={() => navigate('/community')}
          onSeeAll={() => navigate('/community')}
        />



        <MomentsOfTheWeek
          moments={momentMosaic}
          totalCount={momentList.length}
          isPending={momentsQuery.isPending}
          lastSeen={lastSeen}
          creators={creators}
          onCreatorPress={handleCreator}
          onTilePress={handleMoment}
          onSeeAll={() => {
            analyticsEvents.track('community_page_open', {
              source: 'discover_see_all',
              moment_count: momentList.length,
            });
            navigate('/community');
          }}
        />

        <MostPlayedLeaderboard
          rows={mostPlayedList}
          isPending={mostPlayedQuery.isPending}
          onRowPress={handleMostPlayed}
          onSeeAll={mostPlayedList.length > 5 ? () => setMostPlayedSheet(true) : undefined}
        />

        <HonoursBoard
          events={honours}
          isPending={wireLoading}
          onRowPress={handleHonoursRow}
          limit={20}
          onSeeAll={openHonoursSheet}
          onSeeAllLeader={openHonoursLeader}
        />

        {/* Clears the floating bottom nav. Collapses to 16px on routes where
            the nav hides, because the nav publishes --bottom-nav-height: 0px. */}
        <div
          aria-hidden="true"
          style={{ height: 'calc(var(--bottom-nav-height, 88px) + 16px)' }}
        />
      </div>

      <FriendsRoundsSeeAllSheet
        open={friendsSheet}
        onClose={() => setFriendsSheet(false)}
        userId={userId}
        onRowPress={(scoreId, uid) => {
          if (scoreId) opener.openByScore(scoreId, null, uid);
          else opener.openProfile(uid);
        }}
      />

      <GolfThisWeekSheet
        open={golfWeekSheet}
        onClose={() => setGolfWeekSheet(false)}
        userId={userId}
        lens={lens}
        onLensChange={handleLensChange}
        onRowPress={(scoreId, uid) => {
          if (scoreId) opener.openByScore(scoreId, null, uid);
          else opener.openProfile(uid);
        }}
      />

      <FindGolfersSheet open={findGolfers} onClose={() => setFindGolfers(false)} />

      <MostPlayedSheet
        open={mostPlayedSheet}
        onClose={() => setMostPlayedSheet(false)}
        rows={mostPlayedList}
        onRowPress={handleMostPlayed}
      />

      <HonoursBoardSheet
        open={honoursSheet}
        onClose={() => setHonoursSheet(false)}
        events={honours}
        onRowPress={handleHonoursRow}
        initialMode={honoursMode}
        focusUserId={honoursFocus}
      />




      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
}
