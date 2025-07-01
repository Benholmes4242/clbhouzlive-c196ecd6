
import React from 'react';
import ProfilePhotoManager from './ProfilePhotoManager';
import FollowerStats from './FollowerStats';
import UserProfileActions from './UserProfileActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface InstagramStyleProfileHeaderProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
    friendStatus: 'pending' | 'accepted' | null;
  } | null;
  postCount?: number;
}

const InstagramStyleProfileHeader: React.FC<InstagramStyleProfileHeaderProps> = ({
  profile,
  currentUser,
  relationshipStatus,
  postCount = 0
}) => {
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;
  const displayName = profile?.display_name || profile?.username || 'User';
  const username = profile?.username;
  const bio = profile?.bio;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center space-x-4 mb-4">
        {/* Profile Photo */}
        <div className="flex-shrink-0">
          <ProfilePhotoManager
            user={isOwnProfile ? user : null}
            profile={profile}
            onProfileUpdate={() => {}}
            size="lg"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {displayName}
          </h1>
          {username && (
            <p className="text-sm text-gray-600 truncate">@{username}</p>
          )}
          {bio && (
            <p className="text-sm text-gray-800 mt-1 line-clamp-2">{bio}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-4">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">{postCount}</div>
            <div className="text-xs text-gray-600">Posts</div>
          </div>
          <FollowerStats 
            userId={profile?.id} 
            userType={profile?.user_type || 'individual'} 
            username={profile?.username}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {!isOwnProfile && currentUser && (
        <UserProfileActions
          targetUserId={profile.id}
          currentUserId={currentUser.id}
          isFollowing={relationshipStatus?.isFollowing || false}
          friendStatus={relationshipStatus?.friendStatus || null}
          username={profile.username || profile.display_name || 'User'}
          targetUserType={profile.user_type || 'individual'}
          currentUserType={currentUser.user_type || 'individual'}
        />
      )}
    </div>
  );
};

export default InstagramStyleProfileHeader;
