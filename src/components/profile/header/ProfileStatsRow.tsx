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
      <span className="text-[17px] font-semibold text-foreground tabular-nums">
        {value}
      </span>
      <span className="mt-0.5 text-[11px] tracking-[0.12em] uppercase text-foreground/55">
        {label}
      </span>
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
  // Mobile layout - Premium Golf style
  if (isMobile) {
    return (
      <div className="mt-6 flex items-center justify-between max-w-[320px] mx-auto text-center">
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

  // Desktop layout
  return (
    <div 
      className={cn(
        "w-full grid gap-4 py-4 mt-4 text-center",
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
};

export default ProfileStatsRow;
