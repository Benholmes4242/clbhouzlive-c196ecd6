import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useDiscoverLastSeen,
  useMarkDiscoverSeenOnExit,
} from '@/hooks/useDiscoverLastSeen';
import { useExploreLens, type ExploreLens } from './hooks/useExploreLens';
import { useDiscoverLensSets } from './courseled/hooks/useDiscoverLensSets';
import { useWantToPlayToggle } from '@/hooks/useWantToPlayToggle';
import { lensLabelKey } from './wire/ScopePills';
import { toast } from '@/lib/toast';

import { useDiscoverWire, type WireEvent } from './hooks/useDiscoverWire';
import { ScopePills } from './wire/ScopePills';
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import { A, KICKER, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import GlassHeaderPlate from '@/components/chrome/GlassHeaderPlate';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { FriendsRoundsSeeAllSheet } from './FriendsRoundsSeeAllSheet';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import { FriendsPlayedRail } from './courseled/FriendsPlayedRail';
import { OneThingRow } from './courseled/OneThingRow';
import { FindGolfersSheet } from './FindGolfersSheet';
import { AroundTheWorld } from './courseled/AroundTheWorld';
import { PersonalBests } from './courseled/PersonalBests';
import { LatestReviews } from './courseled/LatestReviews';
import { LatestReviewsSheet } from './courseled/LatestReviewsSheet';
import { useLatestReviews, type LatestReview } from './courseled/hooks/useLatestReviews';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';


import { OnTourThisWeek } from './courseled/OnTourThisWeek';
import { MomentsOfTheWeek } from './courseled/MomentsOfTheWeek';
import { MostPlayedLeaderboard } from './courseled/MostPlayedLeaderboard';
import { MostPlayedSheet } from './courseled/MostPlayedSheet';
import { HonoursBoard, sortHonours } from './courseled/HonoursBoard';
import { HonoursBoardSheet } from './courseled/HonoursBoardSheet';
import { useMomentsOfTheWeek, type Moment } from './courseled/hooks/useMomentsOfTheWeek';
import { useFriendIdSet } from './courseled/hooks/useFriendIdSet';
import {
  useCommunityCreators,
  type CommunityCreator,
} from './courseled/hooks/useCommunityCreators';
import { useUserStatsCourseMap } from '@/contexts/UserStatsCoursesContext';
import { useMostPlayedThisWeek, type MostPlayedRow } from './courseled/hooks/useMostPlayedThisWeek';
import type { TourWeekEvent } from './courseled/hooks/useTourThisWeek';

/**
 * Discover, COURSE-LED (BRIEF_DISCOVER_REBUILT_COURSE_LED).
 *
 * The page flips from person-led to course-led: every story is framed "at this
 * course, this is what happened". The course card is the atom — image, dark
 * scrim, name and region, a when-chip, event lines stacked beneath.
 *
 * Vertical space is curated and capped; horizontal rails absorb volume, so a
 * heavy week grows sideways rather than pushing the discovery feed off screen.
 * Six sections, six different anatomies — rail, feed, facts, mosaic,
 * leaderboard, ledger.
 *
 *   1 Where your friends played   rail       (hidden with no friend rounds)
 *   2 Around the world            feed       region pills live here
 *   3 On tour this week           facts rail (next-up fallback off-week)
 *   4 Moments of the week         mosaic     read-only viewer
 *   5 Most played this week       leaderboard
 *   6 The honours board          board      never windowed
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
  const mostPlayedQuery = useMostPlayedThisWeek();
  const mostPlayed = mostPlayedQuery.data;

  const [friendsSheet, setFriendsSheet] = useState(false);
  const [findGolfers, setFindGolfers] = useState(false);
  const [mostPlayedSheet, setMostPlayedSheet] = useState(false);
  const [honoursSheet, setHonoursSheet] = useState(false);
  const [reviewsSheet, setReviewsSheet] = useState(false);

  /**
   * THE SHARED MEMBER BUDGET (BRIEF_PERSONAL_BESTS_SECTION §4). Standout Rounds
   * reports who it is ACTUALLY rendering once its tiles settle; Personal Bests
   * spends two appearances per member across both sections. `null` means not yet
   * settled, and the lower section renders nothing until it is.
   */
  const [standoutCounts, setStandoutCounts] = useState<Map<string, number> | null>(null);
  const handleStandoutMembers = useCallback((counts: Map<string, number>) => {
    setStandoutCounts(counts);
  }, []);

  // LATEST REVIEWS (slot 3): one paginated query, media batched in the same
  // read. No window — "latest" means latest.
  const latestReviews = useLatestReviews();
  const openReviewSheet = useReviewSheetStore((s) => s.open);

  const handleReviewTile = useCallback(
    (r: LatestReview) => {
      analyticsEvents.track('discover_review_tile_tap', {
        review_id: r.reviewId,
        course_id: r.courseId,
        has_media: !!r.mediaUrl,
      });
      openReviewSheet({
        user: {
          id: r.userId ?? '',
          name: r.reviewerName,
          username: r.reviewerUsername ?? undefined,
          avatar: r.reviewerAvatar,
        },
        courseId: r.courseId,
        courseName: r.courseName,
        rating: r.rating,
        reviewId: r.reviewId,
        courseCountry: r.courseCountry,
        courseRegion: r.courseRegion,
        courseSubCountry: r.courseSubCountry,
        reviewText: r.quote,
        breakdown: r.breakdown,
      });
    },
    [openReviewSheet],
  );

  const openReviewsSheet = useCallback(() => {
    analyticsEvents.track('discover_reviews_sheet_open', {
      total: latestReviews.total ?? latestReviews.reviews.length,
    });
    setReviewsSheet(true);
  }, [latestReviews.total, latestReviews.reviews.length]);


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

  // === RELEVANCE LENSES (BRIEF_DISCOVER_RELEVANCE) =========================
  // Membership sets are resolved ONCE for the whole pool — no per-card query.
  const poolCourseIds = useMemo(
    () => [...new Set(pool.map((e) => e.courseId).filter(Boolean))] as string[],
    [pool],
  );
  const sets = useDiscoverLensSets(userId, poolCourseIds);
  const { toggle: toggleWantToPlay, canShortlist: signedIn } = useWantToPlayToggle();

  // Optimistic shortlist overlay: the lens and the glyph read through it, so a
  // tap lands instantly and rolls back on failure.
  const [shortlistOverlay, setShortlistOverlay] = useState<Record<string, boolean>>({});
  const isShortlisted = useCallback(
    (courseId: string) => shortlistOverlay[courseId] ?? sets.shortlist.has(courseId),
    [shortlistOverlay, sets.shortlist],
  );

  const handleToggleShortlist = useCallback(
    (courseId: string) => {
      const next = !isShortlisted(courseId);
      setShortlistOverlay((prev) => ({ ...prev, [courseId]: next }));
      analyticsEvents.track('discover_shortlist_toggle', { course_id: courseId, added: next });
      void toggleWantToPlay({ courseId, want: next }).catch(() => {
        setShortlistOverlay((prev) => ({ ...prev, [courseId]: !next }));
        toast.error(t('discover.shortlist.failed', 'Could not update your list'));
      });
    },
    [isShortlisted, toggleWantToPlay, t],
  );

  // A played/rated course is never a want-to-play course, so the control is
  // hidden there (same resolution the course page's status toggle applies).
  const canShortlistCourse = useCallback(
    (courseId: string) => signedIn && !sets.played.has(courseId),
    [signedIn, sets.played],
  );

  /**
   * RARITY FLOOR — WORLDWIDE only: a stranger's birdie haul at an unknown
   * course is not news. Everything else (eagles, records, ratings, aces,
   * albatrosses) survives. Tunable.
   */
  const WORLDWIDE_RARITY_FLOOR: string[] = ['birdie_haul'];

  const events = useMemo(() => {
    if (lens === 'worldwide') {
      return pool.filter((e) => !WORLDWIDE_RARITY_FLOOR.includes(e.kind));
    }
    if (lens === 'played') {
      return pool.filter((e) => !!e.courseId && sets.played.has(e.courseId));
    }
    if (lens === 'top_100') {
      return pool.filter((e) => !!e.courseId && sets.top100.has(e.courseId));
    }
    /* SUGGESTED SORTS, IT DOES NOT FILTER (BRIEF_STANDOUT_ROUNDS_BACKFILL §1).
       Relevance decides ORDER, not membership: the whole pool is kept so the
       section reaches eight tiles, and the rarity floor applies ONLY to the
       backfill portion — their courses at any rarity, the world at high
       rarity only. Ordering itself stays with priorityFor downstream. */
    return pool.filter((e) => {
      if (!e.courseId) return false;
      const relevant =
        isShortlisted(e.courseId) || sets.top100.has(e.courseId) || sets.played.has(e.courseId);
      if (relevant) return true;
      return !WORLDWIDE_RARITY_FLOOR.includes(e.kind);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, lens, sets.played, sets.top100, isShortlisted]);

  /** FOR YOU order: shortlist, then Top 100, then played, then the rest. */
  const priorityFor = useCallback(
    (courseId: string) => {
      if (lens !== 'suggested') return 0;
      if (isShortlisted(courseId)) return 0;
      if (sets.top100.has(courseId)) return 1;
      if (sets.played.has(courseId)) return 2;
      return 3;
    },
    [lens, isShortlisted, sets.top100, sets.played],
  );

  const lensMeta = lensLabelKey(lens);
  const lensLabel = t(lensMeta.key, lensMeta.fallback);
  /* SUGGESTED IS EMPTY ONLY WHEN THE WHOLE POOL IS (§3): the old
     "rate a course" copy became unreachable and untrue with the backfill. */
  const lensEmptyCopy =
    lens === 'top_100'
      ? t('discover.lens.emptyTop100', 'No Top 100 news in the last 90 days.')
      : lens === 'played'
        ? t('discover.lens.emptyPlayed', 'Nothing at your courses in the last 90 days.')
        : t('discover.emptyPool', 'Nothing logged anywhere in the last 90 days.');




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

  const handleTournament = useCallback(
    (e: TourWeekEvent) => {
      analyticsEvents.track('discover_tour_card_tapped', { tournament_id: e.id });
      navigate(`/tourhub/tournament/${e.id}`);
    },
    [navigate],
  );

  // The media chip deep-links straight to the course Media tab — GolfClubView
  // already reads ?tab=media through asTabId, so no new plumbing is needed.
  const handleTourMedia = useCallback(
    (courseId: string) => {
      analyticsEvents.track('discover_tour_media_tapped', { course_id: courseId });
      navigate(`/courses/${courseId}?tab=media`);
    },
    [navigate],
  );

  // Moments open the shared fullscreen viewer READ-ONLY: Discover reports, it
  // is not a second engagement surface. Both surfaces (mosaic + sheet) share
  // this handler, so the tapped media's identity must travel with the post —
  // otherwise every tile of a multi-media post opens the post's first media.
  const momentPosts = useMemo(() => {
    const seen = new Set<string>();
    const posts = [] as typeof momentList[number]['post'][];
    for (const m of momentList) {
      if (seen.has(m.post.id)) continue;
      seen.add(m.post.id);
      posts.push(m.post);
    }
    return posts;
  }, [momentList]);

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
        options: { readOnly: true },
      });
    },
    [momentPosts],
  );


  // THE WHOLE CARD OPENS THE VIEWER, seeded with that member's moments. Same
  // readOnly path handleMoment uses, with a creator-scoped list passed to it.
  const handleCreator = useCallback(
    (c: CommunityCreator) => {
      analyticsEvents.track('discover_creator_card_tapped', {
        creator_id: c.userId,
        clips: c.clips,
        photos: c.photos,
      });
      const seen = new Set<string>();
      const posts = [] as Moment['post'][];
      for (const m of c.moments) {
        if (seen.has(m.post.id)) continue;
        seen.add(m.post.id);
        posts.push(m.post);
      }
      openWithOrigin({
        posts,
        index: 0,
        originEl: null,
        posterUrl: c.frame.thumbnail,
        mediaIndex: c.frame.mediaIndex ?? 0,
        mediaId: c.frame.mediaId ?? null,
        openedFrom: 'discover-moments',
        options: { readOnly: true },
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
    setHonoursSheet(true);
  }, [honours.length]);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100vh', fontFamily: SANS, ...FIGS }}>
      <div>{shellTabs}</div>

      <GlassHeaderPlate visible={tabsStuck} />
      <div ref={lensSentinelRef} style={{ height: 1 }} aria-hidden />

      {/* The chrome island floats over the page, so the header clears the notch
          plus the island itself — Discover no longer sits under a hero. */}
      <div
        style={{
          // The header block owns NO trailing space: the prompt row owns the
          // 16px above it and the 20px below it, and when the row is absent it
          // collapses to a single 24px gap of its own.
          padding: '0 16px 0',
          // ISLANDS -> EYEBROW = exactly 16px. The island is fixed at
          // sat + 10px and is 44px tall, so its bottom edge is sat + 54px.
          // The old max(sat,47) + 68 formula gave 14px on a notch and 61px
          // without one; sat + 70 gives 16px everywhere.
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)',

        }}
      >
        <div style={KICKER}>{t('discover.kickerCourses', 'The courses')}</div>
        <h1
          style={{
            margin: '4px 0 0',
            fontSize: 26,
            fontWeight: 700,
            color: A.INK,
            letterSpacing: '-0.02em',
          }}
        >
          {t('discover.headlineCourses', "Where it's happening")}
        </h1>
      </div>



      {/* ONE THING (BRIEF_DISCOVER_ONE_THING): one row, one action, session
          dismissible. Renders nothing when there is nothing to ask. */}
      <OneThingRow userId={userId} onFindGolfers={() => setFindGolfers(true)} />

      {/* ONE SECTION RHYTHM: 28px between a section's content and the next
          section's eyebrow. Eyebrows own their own 10px to their content. */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <FriendsPlayedRail
          userId={userId}
          lastSeen={lastSeen}
          onCardPress={handleFriendCard}
          onSeeAll={() => setFriendsSheet(true)}
        />

        <OnTourThisWeek
          lastSeen={lastSeen}
          onTournamentPress={handleTournament}
          onMediaPress={handleTourMedia}
          onTourHub={() => navigate('/tourhub')}
        />

        {/* Slot 3, deliberately: this mosaic and the Moments mosaic read alike,
            so Around the world sits between them. Never adjacent to Moments. */}
        <LatestReviews
          reviews={latestReviews.reviews}
          totalCount={latestReviews.total}
          isPending={latestReviews.isPending}
          viewerId={userId}
          lastSeen={lastSeen}
          onTilePress={handleReviewTile}
          onSeeAll={openReviewsSheet}
        />



        <AroundTheWorld
          events={events}
          isPending={wireLoading}
          userId={userId}
          lastSeen={lastSeen}
          scopeKey={lens}
          pills={
            // The pills belong to Around the World: 12px above (10 from the
            // eyebrow + 2), 14px below so they sit closer to their cards.
            <div style={{ margin: '2px -14px 14px' }}>
              <ScopePills lens={lens} onChange={handleLensChange} />
            </div>
          }
          onCoursePress={(id) => goCourse(id, 'around_the_world')}
          onFeatPress={(scoreId, ownerId) => opener.openByScore(scoreId, null, ownerId)}
          lensLabel={lensLabel}
          emptyCopy={lensEmptyCopy}
          priorityFor={priorityFor}
          canShortlist={canShortlistCourse}
          isShortlisted={isShortlisted}
          onToggleShortlist={handleToggleShortlist}
          onExpand={(revealed) =>
            analyticsEvents.track('discover_courses_expanded', { revealed })
          }
          onRenderedMembers={handleStandoutMembers}
        />

        {/* PERSONAL BESTS — the second tier, feats measured against the member's
            OWN history. Directly below its sibling, and NOT a fifth lens: the
            lenses filter courses, this changes whose history the bar comes from. */}
        <PersonalBests
          userId={userId}
          standoutCounts={standoutCounts}
          onCoursePress={(id) => goCourse(id, 'personal_bests')}
          onFeatPress={(scoreId, ownerId) => opener.openByScore(scoreId, null, ownerId)}
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
          limit={12}
          onSeeAll={openHonoursSheet}
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
      />

      <LatestReviewsSheet
        open={reviewsSheet}
        onClose={() => setReviewsSheet(false)}
        reviews={latestReviews.reviews}
        totalCount={latestReviews.total}
        viewerId={userId}
        onTilePress={handleReviewTile}
        hasNextPage={latestReviews.hasNextPage}
        isFetchingNextPage={latestReviews.isFetchingNextPage}
        onLoadMore={() => void latestReviews.fetchNextPage()}
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
