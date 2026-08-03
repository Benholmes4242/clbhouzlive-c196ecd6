/**
 * CircleView - the merged Circle tab.
 *
 * Absorbs the old Friends and Compete tabs. Composition, in order:
 *   1. ONE leaderboard (FriendsLeaderboardSection - the richer of the two)
 *   2. Friends' rounds
 *   3. Rivalries
 *   4. Course legends
 *   5. Invite
 *
 * There is exactly ONE leaderboard here. YourCircleSection used to draw a
 * second one from the same hook and the two disagreed on the surface
 * ("8th of 28" against "#7 of 25"); it is deleted, not hidden.
 *
 * FRIEND VIEW (decision A4) - explicit, do not re-derive from "owner-only":
 *   SHOWN:      rivalries, course legends
 *   SUPPRESSED: the leaderboard, friends' rounds, invite
 * That is exactly what the old FriendsView hid and the old LegendsView showed,
 * so nothing a member had is lost. StreaksCard now lives on Today.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FriendsLeaderboardSection from '../sections/friends-leaderboard-v2/FriendsLeaderboardSection';
import RecentlyPlayedFeed from '../sections/recently-played/RecentlyPlayedFeed';
import RivalriesSection from '../sections/rivalries/RivalriesSection';
import CourseLegendsSection from '../sections/course-legends/CourseLegendsSection';
import InviteToClbhouzV2 from '../sections/invite-to-clbhouz/InviteToClbhouzV2';
import type { CourseSelection } from '../sections/course-legends/types';

interface Props {
  userId: string;
  readOnly?: boolean;
  /** First name of the profile owner - used in friend view for self-cell labels. */
  ownerFirstName?: string | null;
}

export const CircleView: React.FC<Props> = ({
  userId,
  readOnly = false,
  ownerFirstName = null,
}) => {
  const navigate = useNavigate();

  const handleSelectCourse = (selection: CourseSelection) => {
    navigate(`/courses/${selection.courseId}?tab=legends`);
  };

  return (
    <div
      role="tabpanel"
      id="handicap-panel-circle"
      aria-labelledby="handicap-tab-circle"
      className="[&>section:first-child]:!mt-0 [&>section:first-child>div:first-child]:!pt-0"
      style={{ paddingTop: 32 }}
    >
      {/* 1. The one leaderboard - owner only */}
      {!readOnly && (
        <FriendsLeaderboardSection
          userId={userId}
          viewMode="owner"
          ownerFirstName={ownerFirstName}
        />
      )}

      {/* 2. Friends' rounds - owner only */}
      {!readOnly && <RecentlyPlayedFeed ownerUserId={userId} />}

      {/* 3. Rivalries - shown in friend view */}
      <RivalriesSection userId={userId} />

      {/* 4. Course legends - shown in friend view */}
      <CourseLegendsSection
        userId={userId}
        friendName={readOnly ? ownerFirstName ?? null : null}
        onSelectCourse={handleSelectCourse}
      />

      {/* 5. Invite - owner only */}
      {!readOnly && <InviteToClbhouzV2 ownerUserId={userId} />}
    </div>
  );
};

export default CircleView;
