import React from 'react';
import ProfileHandicapView from './handicap/ProfileHandicapView';

interface HandicapSectionProps {
  userId: string;
  profile: {
    eg_handicap_index?: number | null;
    handicap_sync_interest?: boolean | null;
    updated_at?: string | null;
    [key: string]: any;
  } | null;
  isOwnProfile?: boolean;
}

const HandicapSection: React.FC<HandicapSectionProps> = ({ 
  userId, 
  profile, 
  isOwnProfile = false 
}) => {
  return (
    <ProfileHandicapView 
      userId={userId}
      profile={profile}
      isOwnProfile={isOwnProfile}
    />
  );
};

export default HandicapSection;
