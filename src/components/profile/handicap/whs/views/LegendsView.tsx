import React, { useState } from 'react';
import RivalriesSection from '../sections/rivalries/RivalriesSection';
import FriendsLeaderboardSection from '../sections/friends-leaderboard-v2/FriendsLeaderboardSection';
import StreaksCard from '../../gam/streaks/StreaksCard';
import { StreaksSheetMount } from '../../gam/streaks/StreaksSheetMount';
import CourseLegendsSection from '../sections/course-legends/CourseLegendsSection';
import { CourseLegendsDrilldown } from '../sections/course-legends/CourseLegendsDrilldown';
import type { CourseSelection } from '../sections/course-legends/types';

interface Props {
  userId: string;
  readOnly?: boolean;
  /** First name of the profile owner — used in friend view for self-cell labels. */
  ownerFirstName?: string | null;
}

type ViewMode = { mode: 'list' } | { mode: 'drilldown'; selection: CourseSelection };

export const LegendsView: React.FC<Props> = ({
  userId,
  readOnly = false,
  ownerFirstName = null,
}) => {
  const [view, setView] = useState<ViewMode>({ mode: 'list' });

  return (
    <div
      role="tabpanel"
      id="handicap-panel-legends"
      aria-labelledby="handicap-tab-legends"
      style={{ paddingTop: 16 }}
    >
      {view.mode === 'list' ? (
        <>
          {/* 1. Friends Leaderboard */}
          <FriendsLeaderboardSection userId={userId} />
          {/* 2. Streaks — owner only */}
          {!readOnly && <StreaksCard userId={userId} readOnly={readOnly} />}
          {/* 3. Rivalries */}
          <RivalriesSection userId={userId} />
          {/* 4. Course Legends */}
          <CourseLegendsSection
            userId={userId}
            friendName={readOnly ? ownerFirstName ?? null : null}
            onSelectCourse={(selection) => setView({ mode: 'drilldown', selection })}
          />
          {!readOnly && <StreaksSheetMount />}
        </>
      ) : (
        <CourseLegendsDrilldown
          state={view.selection}
          onBack={() => setView({ mode: 'list' })}
        />
      )}
    </div>
  );
};

export default LegendsView;
