import React from 'react';

interface ProfileStatsRowProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  isPersonal: boolean;
  isMobile: boolean;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  onFriendsClick: () => void;
}

/**
 * ProfileStatsRow - Displays profile stats
 * Personal: Posts, Friends, Following, Followers (4 columns)
 * Business: Posts, Following, Followers (3 columns)
 */
const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({
  postsCount,
  followersCount,
  followingCount,
  friendsCount,
  isPersonal,
  isMobile,
  onFollowersClick,
  onFollowingClick,
  onFriendsClick
}) => {
  if (isMobile) {
    return (
      <div className="stats">
        <div className="stat">
          <div className="stat-value">{postsCount}</div>
          <div className="stat-label">Posts</div>
        </div>
        
        {/* Friends - Personal profiles only */}
        {isPersonal && (
          <button
            type="button"
            onClick={onFriendsClick}
            className="stat cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="stat-value">{friendsCount}</div>
            <div className="stat-label">Friends</div>
          </button>
        )}
        
        <button
          type="button"
          onClick={onFollowingClick}
          className="stat cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="stat-value">{followingCount}</div>
          <div className="stat-label">Following</div>
        </button>
        
        <button
          type="button"
          onClick={onFollowersClick}
          className="stat cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="stat-value">{followersCount}</div>
          <div className="stat-label">Followers</div>
        </button>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={`w-full grid ${isPersonal ? 'grid-cols-4' : 'grid-cols-3'} gap-3 text-center mt-5`}>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-foreground">{postsCount}</span>
        <span className="text-base font-normal text-muted-foreground">Posts</span>
      </div>
      
      {/* Friends - Personal profiles only */}
      {isPersonal && (
        <button
          type="button"
          onClick={onFriendsClick}
          className="flex flex-col border-l border-border pl-3 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
        >
          <span className="text-lg font-semibold text-foreground">{friendsCount}</span>
          <span className="text-base font-normal text-muted-foreground">Friends</span>
        </button>
      )}
      
      <button
        type="button"
        onClick={onFollowingClick}
        className="flex flex-col border-l border-border pl-3 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
      >
        <span className="text-lg font-semibold text-foreground">{followingCount}</span>
        <span className="text-base font-normal text-muted-foreground">Following</span>
      </button>
      
      <button
        type="button"
        onClick={onFollowersClick}
        className="flex flex-col border-l border-border pl-3 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
      >
        <span className="text-lg font-semibold text-foreground">{followersCount}</span>
        <span className="text-base font-normal text-muted-foreground">Followers</span>
      </button>
    </div>
  );
};

export default ProfileStatsRow;
