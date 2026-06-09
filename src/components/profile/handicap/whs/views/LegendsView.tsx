import React from 'react';
import { useNavigate } from 'react-router-dom';
import RivalriesSection from '../sections/rivalries/RivalriesSection';
import FriendsLeaderboardSection from '../sections/friends-leaderboard-v2/FriendsLeaderboardSection';
import StreaksCard from '../../gam/streaks/StreaksCard';
import { StreaksSheetMount } from '../../gam/streaks/StreaksSheetMount';
import CourseLegendsSection from '../sections/course-legends/CourseLegendsSection';
import type { CourseSelection } from '../sections/course-legends/types';

interface Props {
  userId: string;
  readOnly?: boolean;
  /** First name of the profile owner — used in friend view for self-cell labels. */
  ownerFirstName?: string | null;
}

export const LegendsView: React.FC<Props> = ({
  userId,
  readOnly = false,
  ownerFirstName = null,
}) => {
  const navigate = useNavigate();

  const handleSelectCourse = (selection: CourseSelection) => {
    navigate(`/handicap/legends/courses/${selection.courseId}`);
  };

  return (
    <div
      role="tabpanel"
      id="handicap-panel-legends"
      aria-labelledby="handicap-tab-legends"
      className="[&>section:first-child]:!mt-0 [&>section:first-child>div:first-child]:!pt-0"
      style={{ paddingTop: 0 }}
    >
      {/* 1. Friends Leaderboard */}
      <FriendsLeaderboardSection
        userId={userId}
        viewMode={readOnly ? 'friend' : 'owner'}
        ownerFirstName={ownerFirstName}
      />
      {/* 2. Streaks — owner only */}
      {!readOnly && <StreaksCard userId={userId} readOnly={readOnly} />}
      {/* 3. Rivalries */}
      <RivalriesSection userId={userId} />
      {/* 4. Course Legends */}
      <CourseLegendsSection
        userId={userId}
        friendName={readOnly ? ownerFirstName ?? null : null}
        onSelectCourse={handleSelectCourse}
      />
      {!readOnly && <StreaksSheetMount />}
    </div>
  );
};

export default LegendsView;
