import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreRegion } from './hooks/useExploreRegion';
import { useDiscoverWire } from './hooks/useDiscoverWire';
import { ScopePills } from './wire/ScopePills';
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import { A, KICKER, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import GlassHeaderPlate from '@/components/chrome/GlassHeaderPlate';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { FriendsRoundsSeeAllSheet } from './FriendsRoundsSeeAllSheet';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';

import { FriendsPlayedRail } from './courseled/FriendsPlayedRail';
import { AroundTheWorld } from './courseled/AroundTheWorld';
import { REGION_TABS } from './AlmanacSections';
import { OnTourThisWeek } from './courseled/OnTourThisWeek';
import { MomentsOfTheWeek } from './courseled/MomentsOfTheWeek';
import { MomentsSheet } from './courseled/MomentsSheet';
import { MostPlayedLeaderboard } from './courseled/MostPlayedLeaderboard';
import { MostPlayedSheet } from './courseled/MostPlayedSheet';
import { RarestLedger } from './courseled/RarestLedger';
import { useMomentsOfTheWeek, type Moment } from './courseled/hooks/useMomentsOfTheWeek';
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
 *   6 Rarest of all               ledger     never windowed
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

  const { region: activeRegion, setRegion } = useExploreRegion();

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

  const { events, legendary, isLoading: wireLoading } = useDiscoverWire(
    activeRegion,
    userId,
    crownCategoryLabel,
  );
  const { data: moments } = useMomentsOfTheWeek();
  const { data: mostPlayed } = useMostPlayedThisWeek();

  const [friendsSheet, setFriendsSheet] = useState(false);
  const [momentsSheet, setMomentsSheet] = useState(false);
  const [mostPlayedSheet, setMostPlayedSheet] = useState(false);

  const momentList = useMemo(() => moments ?? [], [moments]);
  const mostPlayedList = useMemo(() => mostPlayed ?? [], [mostPlayed]);

  const handleRegionChange = useCallback(
    (slug: string | null) => {
      if (slug === activeRegion) return;
      analyticsEvents.track('discover_scope_changed', {
        from: activeRegion ?? 'worldwide',
        to: slug ?? 'worldwide',
      });
      setRegion(slug);
      scrollPageToTop('smooth');
    },
    [activeRegion, setRegion],
  );

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
    (r: FriendRoundRow) => {
      analyticsEvents.track('discover_friend_round_tapped', {
        course_id: r.course_id ?? null,
        has_score: !!r.score_id,
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
  // is not a second engagement surface.
  const handleMoment = useCallback(
    (m: Moment, index: number) => {
      analyticsEvents.track('discover_moment_tapped', {
        course_id: m.courseId,
        post_id: m.post.id,
      });
      openWithOrigin({
        posts: momentList.map((x) => x.post),
        index,
        originEl: null,
        posterUrl: m.thumbnail,
        openedFrom: 'discover-moments',
        options: { readOnly: true },
      });
    },
    [momentList],
  );

  const handleMostPlayed = useCallback(
    (r: MostPlayedRow) => goCourse(r.courseId, 'most_played'),
    [goCourse],
  );

  const handleRarest = useCallback(
    (e: { courseId: string | null; kind: string; at: string }) => {
      analyticsEvents.track('discover_rarest_tapped', {
        kind: e.kind,
        year: new Date(e.at).getFullYear(),
      });
      if (e.courseId) navigate(`/courses/${e.courseId}`);
    },
    [navigate],
  );

  return (
    <div style={{ background: A.CANVAS, minHeight: '100vh', fontFamily: SANS, ...FIGS }}>
      <div>{shellTabs}</div>

      <GlassHeaderPlate visible={tabsStuck} />
      <div ref={lensSentinelRef} style={{ height: 1 }} aria-hidden />

      {/* The chrome island floats over the page, so the header clears the notch
          plus the island itself — Discover no longer sits under a hero. */}
      <div
        style={{
          padding: '0 16px 12px',
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 52px)',
        }}
      >
        <div style={KICKER}>{t('discover.kickerCourses', 'The courses')}</div>
        <h1
          style={{
            margin: '7px 0 0',
            fontSize: 26,
            fontWeight: 800,
            color: A.INK,
            letterSpacing: '-0.02em',
          }}
        >
          {t('discover.headlineCourses', "Where it's happening")}
        </h1>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <FriendsPlayedRail
          userId={userId}
          onCardPress={handleFriendCard}
          onSeeAll={() => setFriendsSheet(true)}
        />

        <OnTourThisWeek
          onTournamentPress={handleTournament}
          onMediaPress={handleTourMedia}
          onTourHub={() => navigate('/tourhub')}
        />

        <AroundTheWorld
          events={events}
          isLoading={wireLoading}
          userId={userId}
          scopeKey={activeRegion ?? 'worldwide'}
          pills={
            <div style={{ margin: '0 -14px 12px' }}>
              <ScopePills region={activeRegion} onChange={handleRegionChange} />
            </div>
          }
          onCoursePress={(id) => goCourse(id, 'around_the_world')}
          regionLabel={
            REGION_TABS.find((r) => (r.slug ?? null) === (activeRegion ?? null))?.label ??
            'Worldwide'
          }
          onExpand={(revealed) =>
            analyticsEvents.track('discover_courses_expanded', { revealed })
          }
        />


        <MomentsOfTheWeek
          moments={momentList}
          onTilePress={handleMoment}
          onSeeAll={() => setMomentsSheet(true)}
        />

        <MostPlayedLeaderboard
          rows={mostPlayedList}
          onRowPress={handleMostPlayed}
          onSeeAll={mostPlayedList.length > 5 ? () => setMostPlayedSheet(true) : undefined}
        />

        <RarestLedger events={legendary} onRowPress={handleRarest} />

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

      <MomentsSheet
        open={momentsSheet}
        onClose={() => setMomentsSheet(false)}
        moments={momentList}
        onTilePress={handleMoment}
      />

      <MostPlayedSheet
        open={mostPlayedSheet}
        onClose={() => setMostPlayedSheet(false)}
        rows={mostPlayedList}
        onRowPress={handleMostPlayed}
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
