// AchievementsTabPage - Standalone achievements page component
import React from 'react';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';

interface AchievementsTabPageProps {
  userId: string;
  userDisplayName?: string;
  userHandicap?: string | number;
  userProfilePhotoUrl?: string;
  isCurrentUser?: boolean;
}

const AchievementsTabPage: React.FC<AchievementsTabPageProps> = ({
  userId,
  userDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser = true
}) => {
  return (
    <div className="w-full">
      <ClbhouzAchievementsModal
        isOpen={true}
        onClose={() => {}} // No-op since this is not a modal anymore
        userId={userId}
        userDisplayName={userDisplayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isCurrentUser}
      />
    </div>
  );
};

export default AchievementsTabPage;