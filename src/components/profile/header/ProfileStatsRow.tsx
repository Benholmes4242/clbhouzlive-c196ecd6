import React from 'react';
import { Camera, Users, UserPlus, Star } from 'lucide-react';
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
  icon: React.ElementType;
  onClick?: () => void;
  isClickable?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ 
  value, 
  label, 
  icon: Icon,
  onClick, 
  isClickable = false
}) => {
  const content = (
    <div className="flex flex-col items-center gap-1">
      <Icon className="mb-0.5 h-3.5 w-3.5 text-foreground/60" />
      <span className="text-[15px] font-semibold text-slate-900 tabular-nums">
        {value}
      </span>
      <span className="text-[11px] tracking-[0.04em] text-foreground/60 uppercase">
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
 * ProfileStatsRow - Premium stats with icons
 * 4-column grid with icons above numbers
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
  const stats = [
    { id: 'posts', label: 'Posts', value: postsCount, icon: Camera, isClickable: false },
    ...(isPersonal ? [{ id: 'friends', label: 'Friends', value: friendsCount, icon: Users, isClickable: true, onClick: onFriendsClick }] : []),
    { id: 'following', label: 'Following', value: followingCount, icon: UserPlus, isClickable: true, onClick: onFollowingClick },
    { id: 'followers', label: 'Followers', value: followersCount, icon: Star, isClickable: true, onClick: onFollowersClick },
  ];

  return (
    <section className="mt-6">
      <div className={cn(
        "grid gap-4 px-6 text-center",
        isPersonal ? "grid-cols-4" : "grid-cols-3"
      )}>
        {stats.map(({ id, label, value, icon, isClickable, onClick }) => (
          <StatItem 
            key={id}
            value={value} 
            label={label} 
            icon={icon}
            onClick={onClick}
            isClickable={isClickable}
          />
        ))}
      </div>
    </section>
  );
};

export default ProfileStatsRow;