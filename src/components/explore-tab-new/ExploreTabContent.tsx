import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreRegion } from './hooks/useExploreRegion';
import { useDiscoverWire, type WireEvent } from './hooks/useDiscoverWire';
import { useNewsCourses, type NewsCourse } from './hooks/useNewsCourses';
import { ScopePills } from './wire/ScopePills';
import { TheWire } from './wire/TheWire';
import { RarestOfAll } from './wire/RarestOfAll';
import { CoursesInTheNews } from './wire/CoursesInTheNews';
import { YourCircle } from './wire/YourCircle';
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import { A, KICKER, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import GlassHeaderPlate from '@/components/chrome/GlassHeaderPlate';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { SPACE } from '@/lib/spacing';

/**
 * Discover — the amateur circuit's news wire (BRIEF_DISCOVER_REBUILD).
 *
 * Three sections and one control, down from thirteen sections and four
 * controls. Discover is the only surface that answers "what just happened":
 * Courses answers "where might I play", course detail "tell me about this
 * course", Handicap "how am I playing", Clubhouse "what are people saying".
 *
 *   sticky   region scope pills - ONE control for the whole page
 *   headline kicker + "What's been happening"
 *   THE WIRE calendar-month panels over 90 days, paged inside each panel
 *   NEWS     horizontal course rail, after the FIRST month group
 *   RAREST   every ace and albatross, all time, never windowed
 *   CIRCLE   friends' latest rounds, 5 rows + sheet
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
  const {
    courses: newsCourses,
    isLoading: newsLoading,
    hasCandidates: hasNewsCandidates,
  } = useNewsCourses(events);

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

  // Wire rows and news cards ROUTE: a course page is a different surface with
  // its own job. "View all" on the circle is a sheet - bounded set, same rows,
  // coming straight back.
  const handleWireRow = useCallback(
    (e: WireEvent) => {
      analyticsEvents.track('discover_wire_row_tapped', {
        kind: e.kind,
        course_id: e.courseId ?? null,
        is_own: e.isOwn,
      });
      if (e.courseId) navigate(`/courses/${e.courseId}`);
    },
    [navigate],
  );

  const handleNewsCard = useCallback(
    (c: NewsCourse) => {
      analyticsEvents.track('discover_news_card_tapped', {
        course_id: c.courseId,
        why: c.why.kind,
      });
      navigate(`/courses/${c.courseId}`);
    },
    [navigate],
  );

  const opener = useScorecardOpener();
  const handleCircleRow = useCallback(
    (scoreId: string | null, uid: string) => {
      if (scoreId) opener.openByScore(scoreId, null, uid);
      else opener.openProfile(uid);
    },
    [opener],
  );

  // Month expansion answers whether the per-panel cap is set right; there is
  // no infinite scroll left to measure a depth against.
  const handleMonthExpand = useCallback(
    (month: string, revealed: number) => {
      analyticsEvents.track('discover_month_expanded', { month, revealed });
    },
    [],
  );

  // Does the all-time panel earn its place? If nobody taps five feats it
  // becomes a one-line summary rather than a panel.
  const handleRarestRow = useCallback(
    (e: WireEvent) => {
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
      <ScopePills region={activeRegion} onChange={handleRegionChange} />

      <div style={{ padding: '18px 16px 12px' }}>
        <div style={KICKER}>{t('discover.kicker', 'The amateur circuit')}</div>
        <h1
          style={{
            margin: '7px 0 0',
            fontSize: 26,
            fontWeight: 800,
            color: A.INK,
            letterSpacing: '-0.02em',
          }}
        >
          {t('discover.headline', "What's been happening")}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.45, color: A.MUTE }}>
          {t(
            'discover.sub',
            'Eagles and birdie hauls from official WHS rounds, newest first.',
          )}
        </p>
      </div>

      <div
        style={{
          padding: '0 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <TheWire
          events={events}
          isLoading={wireLoading}
          scopeKey={activeRegion ?? 'worldwide'}
          onRowPress={handleWireRow}
          onMonthExpand={handleMonthExpand}
          newsSlot={
            hasNewsCandidates ? (
              <div style={{ padding: '6px 0 2px' }}>
                <CoursesInTheNews
                  courses={newsCourses}
                  isLoading={newsLoading}
                  onCardPress={handleNewsCard}
                  onBrowseAll={() => navigate('/courses')}
                />
              </div>
            ) : null
          }
        />

        <RarestOfAll events={legendary} onRowPress={handleRarestRow} />

        <YourCircle userId={userId} onRowPress={handleCircleRow} />
      </div>

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
