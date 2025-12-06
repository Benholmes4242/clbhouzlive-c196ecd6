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
    <div className="flex flex-col items-center">
      <span className="text-base font-semibold text-foreground tabular-nums">
        {value}
      </span>
      <span className="mt-1 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
    </div>
  );

  const baseClasses = cn(
    "transition-all duration-150",
    isClickable && "cursor-pointer hover:opacity-80 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
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
 * ProfileStatsRow - TikTok/Tinder style compact stats
 * One row, horizontally centered, small uppercase labels
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
  return (
    <section className="mt-5 flex items-center justify-center gap-8 px-4">
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
    </section>
  );
};

export default ProfileStatsRow;
