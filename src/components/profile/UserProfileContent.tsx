import React from 'react';
import LinkedInProfileLayout from './linkedin/LinkedInProfileLayout';

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
  // Check if this is the user's own profile
  const isOwnProfile = currentUser?.id === profile?.id || 
                       (currentUser && profile?.username && currentUser.user_metadata?.username === profile.username);

  if (!profile) {
    return null;
  }

  return (
    <LinkedInProfileLayout 
      profile={profile}
      isOwnProfile={isOwnProfile}
      onProfileUpdate={() => {}}
    />
  );
};

export default UserProfileContent;
