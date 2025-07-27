
import React from 'react';
import HeroProfileHeader from './HeroProfileHeader';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface UserProfileContentProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
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
    <div className="w-full px-4 sm:px-8">
      <HeroProfileHeader 
        profile={profile}
        isOwnProfile={isOwnProfile}
        onProfileUpdate={() => {
          // Profile update will be handled by the HeroProfileHeader component
        }}
        onSectionChange={() => {
          // Section changes will be handled internally by HeroProfileHeader
        }}
      />
    </div>
  );
};

export default UserProfileContent;
