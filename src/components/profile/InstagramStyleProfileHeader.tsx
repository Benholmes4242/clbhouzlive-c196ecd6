
import React from 'react';
import FollowerStats from './FollowerStats';
import UserProfileActions from './UserProfileActions';
import ProfileEditDialog from './ProfileEditDialog';
import StoryBar from '@/components/StoryBar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface InstagramStyleProfileHeaderProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
  } | null;
  onProfileUpdate?: () => void;
}

const InstagramStyleProfileHeader: React.FC<InstagramStyleProfileHeaderProps> = ({
  profile,
  currentUser,
  relationshipStatus,
  onProfileUpdate
}) => {
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;
  const displayName = profile?.display_name || profile?.username || 'User';
  const username = profile?.username;
  const bio = profile?.bio;

  return (
    <div className="bg-white p-4">
      {/* Profile Info */}
      <div className="mb-4">
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
        
        {/* Action Buttons Row */}
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
        
        {/* Edit Profile Button for Own Profile */}
        {isOwnProfile && user && (
          <div className="mt-3">
            <ProfileEditDialog
              profile={profile}
              userId={user.id}
              onProfileUpdate={() => {
                if (onProfileUpdate) {
                  onProfileUpdate();
                }
              }}
            />
          </div>
        )}
        
        {bio && (
          <p className={`text-sm text-gray-800 mt-3 ${profile?.user_type === 'individual' ? 'line-clamp-2' : ''}`}>{bio}</p>
        )}
      </div>

      {/* Stories Section */}
      <div className="mt-4">
        <StoryBar />
      </div>

    </div>
  );
};

export default InstagramStyleProfileHeader;
