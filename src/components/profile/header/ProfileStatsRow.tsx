import React from 'react';
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
  onClick?: () => void;
  isClickable?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ 
  value, 
  label, 
  onClick, 
  isClickable = false
}) => {
  const content = (
    <>
      <div className="text-[16px] font-semibold text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] tracking-wide text-foreground/55 uppercase">
        {label}
      </div>
    </>
  );

  const baseClasses = cn(
    "flex flex-col items-center transition-all duration-150",
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
 * ProfileStatsRow - Premium Golf stats display
 * Shows 3 columns: Posts, Following, Followers
 */
const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({
  postsCount,
  followersCount,
  followingCount,
  isMobile,
  onFollowersClick,
  onFollowingClick,
}) => {
  // Mobile layout - 3 column grid
  if (isMobile) {
    return (
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <StatItem value={postsCount} label="Posts" />
        
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

  // Desktop layout - 3 columns
  return (
    <div 
      className="w-full grid grid-cols-3 gap-4 py-4 mt-4 text-center"
      style={{
        width: 'calc(100% - var(--mini-w) - 8px)',
        marginRight: 'calc(var(--mini-w) + 8px)'
      }}
    >
      <StatItem 
        value={postsCount} 
        label="Posts"
      />
      
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
};

export default ProfileStatsRow;