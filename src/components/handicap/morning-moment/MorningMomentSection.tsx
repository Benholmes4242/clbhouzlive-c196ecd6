/**
 * MorningMomentSection — Friends Yesterday container above the Hero Ring on /handicap.
 *
 * Renders the Friends Yesterday card only (when at least one WHS friend posted
 * yesterday). The home-course weather card and TODAY eyebrow have been removed.
 */
import React, { useEffect } from 'react';
import FriendsYesterdayCard from './FriendsYesterdayCard';
import { useFriendsYesterday } from '@/lib/handicap/useFriendsYesterday';
import { analyticsEvents } from '@/utils/analyticsEvents';

const SKELETON_FILL = 'rgba(248,250,252,0.06)';
const HAIRLINE = 'rgba(248,250,252,0.08)';

const SkeletonCard: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: 224,
      background: SKELETON_FILL,
      border: `0.5px solid ${HAIRLINE}`,
      borderRadius: 18,
    }}
    aria-hidden="true"
  />
);

interface Props {
  userId: string;
}

const MorningMomentSection: React.FC<Props> = ({ userId }) => {
  const { data: friendsData, isLoading: friendsLoading } = useFriendsYesterday(userId);

  const hasFriendsData = !!friendsData && friendsData.friends.length > 0;

  useEffect(() => {
    if (friendsLoading) return;
    analyticsEvents.track('morning_moment_viewed', {
      user_id: userId,
      has_home_club: false,
      has_weather: false,
      has_friends_yesterday: hasFriendsData,
      friends_count: friendsData?.count ?? 0,
      friends_absence_reason: friendsData?.absenceReason ?? 'no_whs_friends',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendsLoading, userId]);

  if (friendsLoading) {
    return (
      <section aria-label="Friends yesterday" style={{ padding: '0 16px 20px' }}>
        <SkeletonCard />
      </section>
    );
  }

  if (!hasFriendsData) return null;

  return (
    <section aria-label="Friends yesterday" style={{ padding: '0 16px 20px' }}>
      <FriendsYesterdayCard data={friendsData!} userId={userId} />
    </section>
  );
};

export default MorningMomentSection;
