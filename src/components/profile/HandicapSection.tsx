import React from 'react';
import ProfileHandicapView from './handicap/ProfileHandicapView';

interface HandicapSectionProps {
  userId: string;
  profile: any;
  isOwnProfile?: boolean;
}

const HandicapSection: React.FC<HandicapSectionProps> = ({ userId, profile, isOwnProfile = false }) => {
  return (
    <ProfileHandicapView 
      userId={userId}
      profile={profile}
      isOwnProfile={isOwnProfile}
    />
  );
};

export default HandicapSection;
