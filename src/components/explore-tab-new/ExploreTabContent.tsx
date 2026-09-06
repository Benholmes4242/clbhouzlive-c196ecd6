import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { getPageScrollTop, scrollPageTo } from '@/lib/getScrollParent';

import { DiscoverHeader, type DiscoverTab } from './DiscoverHeader';
import { NewsTabPage } from './NewsTabPage';
import { GalleryTab } from './GalleryTab';
import { ScoresTab } from './courseled/ScoresTab';

import type { BoardRow } from './courseled/hooks/useBoardPage';
import type { CommunityLibraryItem } from './courseled/hooks/useCommunityLibrary';
import type { FeedPost } from '@/components/media-system/types/media';
import { useScorecardOpener } from './useScorecardOpener';
import {
  readDiscoverReturn,
  withDiscoverReturn,
  withoutDiscoverReturn,
} from './discoverReturnState';

interface ExploreTabContentProps {
  embedded?: boolean;
  shellTabs?: React.ReactNode;
}

/**
 * Discover has three local, non-persisted modes (Scores, News, Gallery). The route remains immersive and
 * therefore this page owns the notch-safe fixed header; chrome-v2 resolves the
 * global island to `none` on /explore without unmounting GlobalHeader.
 */
export default function ExploreTabContent({ embedded = false }: ExploreTabContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const opener = useScorecardOpener();
  const initialReturn = useRef(readDiscoverReturn(location.state));
  const [activeTab, setActiveTab] = useState<DiscoverTab>(() => initialReturn.current?.tab ?? 'scores');

  useLayoutEffect(() => {
    const snapshot = initialReturn.current;
    if (!snapshot || embedded || activeTab !== snapshot.tab) return;

    let frame = 0;
    let animationFrame = 0;
    const restore = () => {
      scrollPageTo(snapshot.scrollY, 'instant');
      frame += 1;
      const restored = Math.abs(getPageScrollTop() - snapshot.scrollY) < 2;
      if (!restored && frame < 180) {
        animationFrame = window.requestAnimationFrame(restore);
        return;
      }

      initialReturn.current = null;
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: withoutDiscoverReturn(location.state),
      });
    };

    animationFrame = window.requestAnimationFrame(restore);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activeTab, embedded, location.pathname, location.search, location.state, navigate]);

  const rememberDiscoverPosition = useCallback((tab: DiscoverTab) => {
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: withDiscoverReturn(location.state, { tab, scrollY: getPageScrollTop() }),
    });
  }, [location.pathname, location.search, location.state, navigate]);

  const changeTab = useCallback((next: DiscoverTab) => {
    initialReturn.current = null;
    setActiveTab(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleBoardRow = useCallback((row: BoardRow) => {
    analyticsEvents.track('discover_board_row_tapped', {
      pos: row.pos,
      has_score: !!row.whs_score_id,
    });
    if (row.whs_score_id) opener.openByScore(row.whs_score_id, null, row.user_id);
    else opener.openProfile(row.user_id);
  }, [opener]);

  const openMedia = useCallback((pool: CommunityLibraryItem[], item: CommunityLibraryItem, openedFrom: string) => {
    rememberDiscoverPosition('gallery');
    const posts = pool.map((entry) => entry.post);
    const index = Math.max(0, posts.findIndex((post) => post.id === item.postId));
    openWithOrigin({
      posts,
      index,
      originEl: null,
      posterUrl: item.thumbnail,
      mediaIndex: item.mediaIndex ?? 0,
      mediaId: item.mediaId ?? null,
      openedFrom,
      forceStartAtZero: true,
    });
  }, [rememberDiscoverPosition]);

  const openNewsStory = useCallback((slug: string) => {
    rememberDiscoverPosition('news');
    navigate(`/discover/news/${slug}`);
  }, [navigate, rememberDiscoverPosition]);

  // BRIEF_GALLERY_TO_WATCH S3 — opens the COURSE's media set at the tapped
  // image, browsed vertically, through the course media tab's own viewer
  // surface key. forceStartAtZero would defeat S3.4.
  const openReviewMedia = useCallback((posts: FeedPost[], index: number, mediaId: string | null, posterUrl: string | null) => {
    rememberDiscoverPosition('gallery');
    openWithOrigin({
      posts,
      index,
      originEl: null,
      posterUrl,
      mediaId,
      openedFrom: 'course-media',
      options: { readOnly: true },
    });
  }, [rememberDiscoverPosition]);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS, ...FIGS }}>
      {!embedded && <DiscoverHeader active={activeTab} onChange={changeTab} />}

      {activeTab === 'scores' ? (
        <main style={{ paddingTop: embedded ? 0 : 'var(--discover-header-h)' }}>
          <div style={{ padding: '0 14px 110px' }}>
            {/* BRIEF_SCORES_TWO_HALVES — one reference surface, two equal halves
                under one filter. The hero and the duplicate course tiles are
                gone; GolfThisWeek is no longer mounted here. */}
            <ScoresTab
              userId={user?.id}
              onRowPress={handleBoardRow}
              onCoursePress={(courseId) => navigate(`/courses/${courseId}`)}
              onMemberPress={(memberId) => opener.openProfile(memberId)}
              belowDiscoverHeader={!embedded}
            />
          </div>
        </main>
      ) : activeTab === 'news' ? (

        <NewsTabPage onOpenStory={openNewsStory} />
      ) : (
        <GalleryTab onOpenPost={openMedia} onOpenReview={openReviewMedia} />
      )}

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