import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialCounts } from '@/hooks/useSocialCounts';

interface FollowerStatsProps {
  userId: string;
  userType?: string;
  username?: string;
  compact?: boolean;
}

const FollowerStats: React.FC<FollowerStatsProps> = ({ userId, userType = 'individual', username, compact = false }) => {
  const navigate = useNavigate();
  const { data: counts, isLoading } = useSocialCounts(userId);

  const handleFollowingClick = () => {
    if (username) {
      navigate(`/profile/${username}/following`);
    }
  };

  const handleFollowersClick = () => {
    if (username) {
      navigate(`/profile/${username}/followers`);
    }
  };

  const handleFriendsClick = () => {
    if (username) {
      navigate(`/profile/${username}/followers?tab=following&filter=friends`);
    }
  };

  return (
    <div className={compact ? "flex items-center gap-4" : "flex justify-center gap-8 py-4 border-y border-border"}>
      {/* Following */}
      <div 
        className={`text-center cursor-pointer hover:bg-muted/50 rounded transition-colors ${
          compact ? 'py-1 px-2' : 'px-2 py-1'
        }`} 
        onClick={handleFollowingClick}
      >
        <div className={compact ? "text-sm font-semibold" : "text-xl font-bold"}>
          {isLoading ? '...' : counts?.following || 0}
        </div>
        <div className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
          Following
        </div>
      </div>

      {/* Followers */}
      <div 
        className={`text-center cursor-pointer hover:bg-muted/50 rounded transition-colors ${
          compact ? 'py-1 px-2' : 'px-2 py-1'
        }`} 
        onClick={handleFollowersClick}
      >
        <div className={compact ? "text-sm font-semibold" : "text-xl font-bold"}>
          {isLoading ? '...' : counts?.followers || 0}
        </div>
        <div className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
          Followers
        </div>
      </div>

      {/* Friends */}
      <div 
        className={`text-center cursor-pointer hover:bg-muted/50 rounded transition-colors ${
          compact ? 'py-1 px-2' : 'px-2 py-1'
        }`} 
        onClick={handleFriendsClick}
      >
        <div className={compact ? "text-sm font-semibold" : "text-xl font-bold"}>
          {isLoading ? '...' : counts?.friends || 0}
        </div>
        <div className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
          Friends
        </div>
      </div>
    </div>
  );
};

export default FollowerStats;
