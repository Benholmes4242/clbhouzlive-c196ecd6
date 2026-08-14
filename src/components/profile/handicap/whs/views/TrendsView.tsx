import React from 'react';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import GameEverywhereCard from '../sections/trends/GameEverywhereCard';
import RoundShapePanel from '../sections/trends/RoundShapePanel';
import RoundsArchivePanel from '../sections/trends/RoundsArchivePanel';
import PersonalBests from '../sections/records/PersonalBests';
import YourCoursesRail from '../sections/trends/YourCoursesRail';

import StablefordCard from '../sections/trends/StablefordCard';
import { useAllScores } from '@/lib/whs/hooks';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * FORM - the whole of the old Trends tab plus the whole of the old Rounds tab.
 *
 * The round list is no longer a section: RoundsArchivePanel states the figures
 * and RoundsArchiveSheet carries the list at 75dvh.
 */

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /** When true, hides personal-only sections (Echo Insights, Where You Stand). */
  readOnly?: boolean;
  /** First name of the profile owner — used to name-prefix friend-view copy. */
  ownerFirstName?: string | null;
}

export const TrendsView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
  readOnly = false,
  ownerFirstName = null,
}) => {
  const viewMode: 'owner' | 'friend' = readOnly ? 'friend' : 'owner';
  const { data: scores, isLoading: scoresLoading } = useAllScores(connectionId);

  return (
    <div
      role="tabpanel"
      id="handicap-panel-form"
      aria-labelledby="handicap-tab-form"
      className="[&>section:first-child]:!mt-0 [&>section:first-child>div:first-child]:!pt-0"
      style={{ paddingTop: 32 }}
    >
      {/* 1. Rounds That Count */}
      <RoundsThatCountCard
        connectionId={connectionId}
        userId={userId}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 2. Stableford distribution */}
      <section style={{ padding: '0 16px', marginTop: 32, fontFamily: FONT }}>
        {scoresLoading ? (
          <Skeleton variant="dark" style={{ height: 420, borderRadius: 16, marginBottom: 12 }} />
        ) : (
          <StablefordCard scores={scores ?? []} userId={userId} connectionId={connectionId} />
        )}
      </section>

      {/* 3. Where the shots go — par-type rings, one shared max */}
      <GameEverywhereCard readOnly={readOnly} />

      {/* 4. When the shots go — thirds of the round */}
      <RoundShapePanel readOnly={readOnly} />

      {/* 5. Personal bests */}
      <PersonalBests
        connectionId={connectionId}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 6. Posted history — figures here, list in the 75dvh sheet */}
      <RoundsArchivePanel
        connectionId={connectionId}
        userId={userId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 7. Your courses — cross-link rail to each course's Analytics tab */}
      <YourCoursesRail readOnly={readOnly} />
    </div>
  );
};

export default TrendsView;
