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
  darkTheme?: boolean;
}

interface StatItemProps {
  value: number;
  label: string;
  onClick?: () => void;
  isClickable?: boolean;
  darkTheme?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ 
  value, 
  label, 
  onClick, 
  isClickable = false,
  darkTheme = false
}) => {
  const content = (
    <div className="flex flex-col items-center">
      <span className={cn(
        "text-base font-semibold tabular-nums",
        darkTheme ? "text-white/92" : "text-foreground"
      )}>
        {value}
      </span>
      <span className={cn(
        "mt-1 text-[11px] uppercase tracking-[0.06em]",
        darkTheme ? "text-white/55" : "text-muted-foreground"
      )}>
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
  onFriendsClick,
  darkTheme = false
}) => {
  return (
    <section className="mt-5 flex items-center justify-center gap-8 px-4">
      <StatItem value={postsCount} label="Posts" darkTheme={darkTheme} />
      
      {isPersonal && (
        <StatItem 
          value={friendsCount} 
          label="Friends" 
          onClick={onFriendsClick}
          isClickable
          darkTheme={darkTheme}
        />
      )}
      
      <StatItem 
        value={followingCount} 
        label="Following" 
        onClick={onFollowingClick}
        isClickable
        darkTheme={darkTheme}
      />
      
      <StatItem 
        value={followersCount} 
        label="Followers" 
        onClick={onFollowersClick}
        isClickable
        darkTheme={darkTheme}
      />
    </section>
  );
};

export default ProfileStatsRow;
