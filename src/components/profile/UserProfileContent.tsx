
import React from 'react';
import InstagramStyleProfileHeader from './InstagramStyleProfileHeader';
import UniversalProfileTabs from './UniversalProfileTabs';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface UserProfileContentProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
    friendStatus: 'pending' | 'accepted' | null;
  } | null;
}

const UserProfileContent: React.FC<UserProfileContentProps> = ({
  profile,
  currentUser,
  relationshipStatus
}) => {
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <InstagramStyleProfileHeader 
        profile={profile}
        currentUser={currentUser}
        relationshipStatus={relationshipStatus}
      />
      
      <UniversalProfileTabs
        userId={profile?.id}
        profile={profile}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default UserProfileContent;
