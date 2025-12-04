import React from 'react';
import { FileText, Users, UserPlus, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface StatItemProps {
  value: number;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isClickable?: boolean;
  showBorder?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ 
  value, 
  label, 
  icon,
  onClick, 
  isClickable = false,
  showBorder = false 
}) => {
  const content = (
    <>
      <span className="text-lg font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
    </>
  );

  const baseClasses = cn(
    "flex flex-col items-center py-1 transition-all duration-150",
    showBorder && "border-l border-border/50 pl-4",
    isClickable && "cursor-pointer hover:scale-105 hover:opacity-90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
  );

  if (isClickable && onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
};

/**
 * ProfileStatsRow - Displays profile stats with micro-interactions
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
      <div className="flex items-center justify-center gap-6 py-3">
        <StatItem value={postsCount} label="Posts" />
        
        {isPersonal && (
          <StatItem 
            value={friendsCount} 
            label="Friends" 
            onClick={onFriendsClick}
            isClickable
          />
        )}
        
        <StatItem 
          value={followingCount} 
          label="Following" 
          onClick={onFollowingClick}
          isClickable
        />
        
        <StatItem 
          value={followersCount} 
          label="Followers" 
          onClick={onFollowersClick}
          isClickable
        />
      </div>
    );
  }

  // Desktop layout with subtle icons and borders
  return (
    <div 
      className={cn(
        "w-full grid gap-4 py-4 mt-4",
        isPersonal ? "grid-cols-4" : "grid-cols-3"
      )}
      style={{
        width: 'calc(100% - var(--mini-w) - 8px)',
        marginRight: 'calc(var(--mini-w) + 8px)'
      }}
    >
      <StatItem 
        value={postsCount} 
        label="Posts"
      />
      
      {isPersonal && (
        <StatItem 
          value={friendsCount} 
          label="Friends"
          onClick={onFriendsClick}
          isClickable
          showBorder
        />
      )}
      
      <StatItem 
        value={followingCount} 
        label="Following"
        onClick={onFollowingClick}
        isClickable
        showBorder
      />
      
      <StatItem 
        value={followersCount} 
        label="Followers"
        onClick={onFollowersClick}
        isClickable
        showBorder
      />
    </div>
  );
};

export default ProfileStatsRow;
