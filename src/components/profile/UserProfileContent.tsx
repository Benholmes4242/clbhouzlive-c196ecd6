
import React, { useState } from 'react';
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
  // Check if this is the user's own profile - handle both user ID and username matching
  const isOwnProfile = user?.id === profile?.id || 
                       (user && profile?.username && user.user_metadata?.username === profile.username) ||
                       (user && profile?.username === user.email?.split('@')[0]);
  const [activeSection, setActiveSection] = useState('activity');

  // Debug logging for authentication issues
  console.log('UserProfileContent Debug:', {
    userId: user?.id,
    profileId: profile?.id,
    profileUsername: profile?.username,
    userMetadataUsername: user?.user_metadata?.username,
    userEmail: user?.email,
    isOwnProfile,
    userIdMatch: user?.id === profile?.id,
    usernameMatch: user && profile?.username && user.user_metadata?.username === profile.username,
    emailMatch: user && profile?.username === user.email?.split('@')[0]
  });


  if (!profile) {
    return null;
  }

  return (
    <>
      <HeroProfileHeader 
        profile={profile}
        isOwnProfile={isOwnProfile}
        onProfileUpdate={() => {
          // Profile update will be handled by the HeroProfileHeader component
        }}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </>
  );
};

export default UserProfileContent;
