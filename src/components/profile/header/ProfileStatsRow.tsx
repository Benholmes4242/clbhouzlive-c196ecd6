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
    <div className="flex flex-col leading-tight">
      <span className="text-lg md:text-xl font-semibold text-slate-900 tabular-nums">
        {value}
      </span>
      <span className="mt-1.5 text-sm md:text-base font-medium text-slate-600">
        {label}
      </span>
    </div>
  );

  const baseClasses = cn(
    "transition-all duration-150",
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
 * Numbers bold, labels regular casing with font-medium
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
    <section className="mt-8 flex justify-center">
      <div className="flex items-center gap-10 md:gap-14 text-center">
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
    </section>
  );
};

export default ProfileStatsRow;