import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';

interface GolferRowProps {
  golfer: {
    id: string;
    displayName: string;
    username?: string;
    profileImage: string;
    homeClub?: string;
    handicap?: number | null;
  };
  isFollowing: boolean;
  friendStatus?: 'none' | 'pending' | 'friends';
  loading?: boolean;
  onFollowToggle: () => void;
  onFriendRequest?: () => void;
}

// Shared base pill class matching Activity page buttons
const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-6 text-[11px] font-semibold transition-colors";

export function GolferRow({ 
  golfer, 
  isFollowing, 
  friendStatus = 'none',
  loading, 
  onFollowToggle,
  onFriendRequest
}: GolferRowProps) {
  const navigate = useNavigate();

  const clubLine = golfer.homeClub || 'No home club set';
  const handicapLine = golfer.handicap != null ? `HCP ${golfer.handicap.toFixed(1)}` : null;

  const handleRowClick = () => {
    navigate(`/users/${golfer.id}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowToggle();
  };

  const handleFriendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (friendStatus !== 'pending' && onFriendRequest) {
      onFriendRequest();
    }
  };

  return (
    <button
      onClick={handleRowClick}
      className={cn(
        "w-full text-left transition-all duration-200 relative",
        "rounded-sq-md px-4 py-3 min-h-[86px] flex items-stretch",
        "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border/40",
        "hover:bg-background/80"
      )}
    >
      <div className="flex w-full gap-3">
        {/* Avatar with badge */}
        <div className="relative shrink-0" style={{ width: 44, height: 46 }}>
          <SquircleAvatar
            src={golfer.profileImage}
            alt={golfer.displayName}
            size={44}
            fallback={golfer.displayName?.charAt(0) || '?'}
            ringColor={getRingColorForTotalPlayed(0)}
          />
          <span className="absolute bottom-0 right-0 translate-x-1 translate-y-1 h-5 w-5 rounded-full border-2 border-card bg-background flex items-center justify-center shadow-sm">
            <UserPlus className="h-3 w-3 text-emerald-500" />
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-foreground">
            <span className="font-semibold">{golfer.displayName}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{clubLine}</p>
          {handicapLine && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{handicapLine}</p>
          )}

          {/* Action buttons - bottom right */}
          <div className="mt-2 flex items-center justify-end gap-2">
            {/* Follow/Following button */}
            {isFollowing ? (
              <span className={cn(basePillClass, "border-border bg-muted text-foreground/80 gap-1")}>
                <Check className="h-3 w-3" />
                Following
              </span>
            ) : (
              <button
                onClick={handleFollowClick}
                disabled={loading}
                className={cn(
                  basePillClass,
                  "border-orange-500 bg-orange-500/10 text-orange-600 hover:bg-orange-500/15",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {loading ? 'Following...' : 'Follow'}
              </button>
            )}

            {/* Add friend button */}
            {onFriendRequest && friendStatus !== 'friends' && (
              friendStatus === 'pending' ? (
                <span className={cn(basePillClass, "border-border bg-muted text-foreground/60")}>
                  Pending
                </span>
              ) : (
                <button
                  onClick={handleFriendClick}
                  disabled={loading}
                  className={cn(
                    basePillClass,
                    "border-emerald-500 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  Add friend
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </button>
  );
}