/**
 * MorningMomentSection — Friends Yesterday container above the Hero Ring on /handicap.
 *
 * Renders the Friends Yesterday card only (when at least one WHS friend posted
 * yesterday). The home-course weather card and TODAY eyebrow have been removed.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FriendsYesterdayCard from './FriendsYesterdayCard';
import { useFriendsYesterday } from '@/lib/handicap/useFriendsYesterday';
import { analyticsEvents } from '@/utils/analyticsEvents';

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

  const show = !friendsLoading && hasFriendsData;

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="morning-moment"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <section aria-label="Friends yesterday" style={{ padding: '0 0 20px' }}>
            <FriendsYesterdayCard data={friendsData!} userId={userId} />
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MorningMomentSection;
