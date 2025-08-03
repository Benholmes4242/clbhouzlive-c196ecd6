
import React from 'react';
import GamificationProgressBar from './GamificationProgressBar';

interface AchievementsSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  userId,
  isOwnProfile
}) => {
  return (
    <GamificationProgressBar 
      userId={userId}
      isOwnProfile={isOwnProfile}
    />
  );
};

export default AchievementsSection;
