
import React from 'react';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfilePhotoManager from '@/components/profile/ProfilePhotoManager';
import ProfileSections from '@/components/profile/ProfileSections';
import UserProfileActions from '@/components/profile/UserProfileActions';
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
  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="max-w-2xl mx-auto px-4">
      <ProfilePhotoManager
        user={isOwnProfile ? profile : null}
        profile={profile}
        onProfileUpdate={() => {}}
      />
      
      <ProfileInfo
        profile={profile}
        userEmail={profile.display_name || profile.username}
        userId={profile.id}
        onProfileUpdate={() => {}}
      />

      {!isOwnProfile && currentUser && (
        <UserProfileActions
          targetUserId={profile.id}
          currentUserId={currentUser.id}
          isFollowing={relationshipStatus?.isFollowing || false}
          friendStatus={relationshipStatus?.friendStatus || null}
          username={profile.username || profile.display_name || 'User'}
        />
      )}

      <ProfileSections
        profile={profile}
        user={profile}
        onEGVisibilityToggle={() => {}}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default UserProfileContent;
