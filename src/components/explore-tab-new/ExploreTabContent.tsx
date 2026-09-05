import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { openWithOrigin } from '@/lib/openWithOrigin';

import { DiscoverHeader, type DiscoverTab } from './DiscoverHeader';
import { NewsMediaTab } from './NewsMediaTab';
import { GolfThisWeek } from './courseled/GolfThisWeek';
import { CoursesPlayedSection } from './courseled/CoursesPlayedSection';
import type { BoardFilters } from './courseled/boardFilters';
import type { BoardRow } from './courseled/hooks/useBoardPage';
import type { CommunityLibraryItem } from './courseled/hooks/useCommunityLibrary';
import { useScorecardOpener } from './useScorecardOpener';

interface ExploreTabContentProps {
  embedded?: boolean;
  shellTabs?: React.ReactNode;
}

/**
 * Discover has two local, non-persisted modes. The route remains immersive and
 * therefore this page owns the notch-safe fixed header; chrome-v2 resolves the
 * global island to `none` on /explore without unmounting GlobalHeader.
 */
export default function ExploreTabContent({ embedded = false }: ExploreTabContentProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const opener = useScorecardOpener();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('circuit');
  const [boardFilters, setBoardFilters] = useState<BoardFilters | null>(null);

  const changeTab = useCallback((next: DiscoverTab) => {
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
    });
  }, []);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS, ...FIGS }}>
      {!embedded && <DiscoverHeader active={activeTab} onChange={changeTab} />}

      {activeTab === 'circuit' ? (
        <main style={{ paddingTop: embedded ? 0 : 'var(--discover-header-h)' }}>
          <div style={{ padding: '0 14px 110px' }}>
            <GolfThisWeek
              userId={user?.id}
              onRowPress={handleBoardRow}
              onAppliedFiltersChange={setBoardFilters}
              belowDiscoverHeader={!embedded}
            >
              {boardFilters && (
                <CoursesPlayedSection
                  userId={user?.id}
                  filters={boardFilters}
                  onCoursePress={(courseId) => navigate(`/courses/${courseId}`)}
                  onMemberPress={(memberId) => opener.openProfile(memberId)}
                />
              )}
            </GolfThisWeek>
          </div>
        </main>
      ) : (
        <NewsMediaTab onOpenPost={openMedia} />
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