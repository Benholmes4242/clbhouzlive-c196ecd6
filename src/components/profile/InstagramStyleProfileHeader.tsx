
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
  } | null;
}

const InstagramStyleProfileHeader: React.FC<InstagramStyleProfileHeaderProps> = ({
  profile,
  currentUser,
  relationshipStatus
}) => {
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;
  const displayName = profile?.display_name || profile?.username || 'User';
  const username = profile?.username;
  const bio = profile?.bio;

  return (
    <div className="bg-white p-4">
      {/* Profile Photo and Basic Info */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-shrink-0">
          <ProfilePhotoManager
            user={isOwnProfile ? user : null}
            profile={profile}
            onProfileUpdate={() => {}}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {displayName}
          </h1>
          {username && (
            <p className="text-sm text-gray-600 truncate">@{username}</p>
          )}
          
          {/* Follower Stats - moved up beneath name/username */}
          <div className="mt-2">
            <FollowerStats 
              userId={profile?.id} 
              userType={profile?.user_type || 'individual'} 
              username={profile?.username}
              compact={true}
            />
          </div>
          
          {/* Action Buttons Row - now after stats */}
          {!isOwnProfile && currentUser && (
            <div className="mt-3">
              <UserProfileActions
                targetUserId={profile.id}
                currentUserId={currentUser.id}
                isFollowing={relationshipStatus?.isFollowing || false}
                username={profile.username || profile.display_name || 'User'}
                targetUserType={profile.user_type || 'individual'}
                currentUserType={currentUser.user_type || 'individual'}
              />
            </div>
          )}
          
          {bio && (
            <p className="text-sm text-gray-800 mt-3 line-clamp-2">{bio}</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default InstagramStyleProfileHeader;
