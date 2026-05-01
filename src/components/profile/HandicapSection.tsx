import React from 'react';
import ProfileHandicapView from './handicap/ProfileHandicapView';
import WhsHandicapTab from './handicap/whs/WhsHandicapTab';

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
  isOwnProfile = false,
}) => {
  // Own profile gets the new England Golf (WHS) connect / dashboard flow.
  // Other users still see the read-only manual handicap view.
  if (isOwnProfile && userId) {
    return <WhsHandicapTab userId={userId} />;
  }

  return (
    <ProfileHandicapView
      userId={userId}
      profile={profile}
      isOwnProfile={isOwnProfile}
    />
  );
};

export default HandicapSection;
