import React, { useState } from 'react';
import { MoreHorizontal, X, BarChart3, Star, Zap, Trophy, Target, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ProfileStatsRowV2Props {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  isPersonal: boolean;
  // Extended stats for drawer
  coursesRated?: number;
  avgRating?: number;
  xpTotal?: number;
  xpToNextLevel?: number;
  roundsLogged?: number;
  achievementsCount?: number;
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
    <div className="flex flex-col items-center leading-tight">
      <span className="text-lg md:text-xl font-bold text-foreground tabular-nums">
        {value}
      </span>
      <span className="mt-0.5 text-xs uppercase tracking-wide font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );

  const baseClasses = cn(
    'flex-1 py-2 transition-all duration-150',
    isClickable && 'cursor-pointer hover:bg-white/[0.04] active:scale-[0.98] rounded-sq-sm'
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

interface DrawerStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

const DrawerStat: React.FC<DrawerStatProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
    <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
  </div>
);

/**
 * ProfileStatsRowV2 - Stats row with expandable drawer
 * Three equal-width stat buttons
 * Three dots icon on right opens drawer with extended stats
 */
const ProfileStatsRowV2: React.FC<ProfileStatsRowV2Props> = ({
  postsCount,
  followersCount,
  followingCount,
  friendsCount,
  isPersonal,
  coursesRated = 0,
  avgRating = 0,
  xpTotal = 0,
  xpToNextLevel = 0,
  roundsLogged = 0,
  achievementsCount = 0,
  onFollowersClick,
  onFollowingClick,
  onFriendsClick,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section className="mt-6">
      <div className="flex items-center">
        {/* Main stats */}
        <div className="flex-1 flex items-center justify-around">
          <StatItem value={postsCount} label="Posts" />
          <StatItem 
            value={followersCount} 
            label="Followers" 
            onClick={onFollowersClick}
            isClickable
          />
          <StatItem 
            value={followingCount} 
            label="Following" 
            onClick={onFollowingClick}
            isClickable
          />
        </div>
        
        {/* Three dots button */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'p-2 rounded-sq-sm',
                'hover:bg-white/[0.06] active:scale-[0.95]',
                'transition-all duration-150'
              )}
            >
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </SheetTrigger>
          
          <SheetContent 
            side="bottom" 
            className="bg-black/95 border-t border-white/[0.1] rounded-t-[20px]"
          >
            <SheetHeader className="pb-4">
              <SheetTitle className="text-lg font-semibold text-foreground">
                Profile Stats
              </SheetTitle>
            </SheetHeader>
            
            <div className="space-y-0">
              <DrawerStat 
                icon={BarChart3} 
                label="Courses Rated" 
                value={coursesRated} 
              />
              <DrawerStat 
                icon={Star} 
                label="Avg Rating" 
                value={avgRating.toFixed(1)} 
              />
              <DrawerStat 
                icon={Flag} 
                label="Rounds Logged" 
                value={roundsLogged} 
              />
              <DrawerStat 
                icon={Trophy} 
                label="Achievements" 
                value={achievementsCount} 
              />
              
              {isPersonal && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onFriendsClick();
                  }}
                  className="flex items-center justify-between py-3 w-full hover:bg-white/[0.04] -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Friends</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {friendsCount}
                  </span>
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  );
};

export default ProfileStatsRowV2;
