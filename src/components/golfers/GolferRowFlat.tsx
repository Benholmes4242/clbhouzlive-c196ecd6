import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MoreHorizontal } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GolferRowFlatProps {
  golfer: {
    id: string;
    displayName: string;
    username?: string;
    profileImage: string;
    homeClub?: string;
    handicap?: number | null;
    totalTop100Played?: number;
  };
  isFollowing: boolean;
  friendStatus?: 'none' | 'pending' | 'friends';
  loading?: boolean;
  onFollowToggle: () => void;
  onFriendRequest?: () => void;
}

export function GolferRowFlat({ 
  golfer, 
  isFollowing, 
  friendStatus = 'none',
  loading, 
  onFollowToggle,
  onFriendRequest
}: GolferRowFlatProps) {
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

  // Show Add friend button only when already following (per spec)
  const showAddFriendButton = isFollowing && onFriendRequest && friendStatus !== 'friends';
  // Show overflow menu when not following but friend action available
  const showOverflowMenu = !isFollowing && onFriendRequest && friendStatus !== 'friends';

  return (
    <button
      onClick={handleRowClick}
      className="w-full text-left px-6 py-4 flex items-center gap-3 border-b border-border/25 hover:bg-muted/30 transition-colors"
    >
      {/* Avatar */}
      <SquircleAvatar
        src={golfer.profileImage}
        alt={golfer.displayName}
        size={48}
        fallback={golfer.displayName?.charAt(0) || '?'}
        ringColor={getRingColorForTotalPlayed(golfer.totalTop100Played || 0)}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{golfer.displayName}</p>
        <p className="text-sm text-muted-foreground truncate">{clubLine}</p>
        {handicapLine && (
          <p className="text-xs text-muted-foreground">{handicapLine}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Follow/Following button */}
        {isFollowing ? (
          <button
            onClick={handleFollowClick}
            disabled={loading}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition-colors",
              "bg-muted text-foreground/80 border border-border",
              "hover:bg-muted/80 disabled:opacity-60"
            )}
          >
            <Check className="h-3.5 w-3.5" />
            Following
          </button>
        ) : (
          <button
            onClick={handleFollowClick}
            disabled={loading}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
              "border border-foreground/20 text-foreground",
              "hover:bg-foreground/5 disabled:opacity-60"
            )}
          >
            {loading ? 'Following...' : 'Follow'}
          </button>
        )}

        {/* Add friend button - shown when following */}
        {showAddFriendButton && (
          friendStatus === 'pending' ? (
            <span className="h-9 px-4 rounded-lg text-sm font-medium inline-flex items-center bg-muted text-foreground/60 border border-border">
              Pending
            </span>
          ) : (
            <button
              onClick={handleFriendClick}
              disabled={loading}
              className={cn(
                "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
                "border border-foreground/20 text-foreground",
                "hover:bg-foreground/5 disabled:opacity-60"
              )}
            >
              Add friend
            </button>
          )
        )}

        {/* Overflow menu - shown when not following but friend action available */}
        {showOverflowMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleFriendClick}>
                Add friend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/users/${golfer.id}`)}>
                View profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </button>
  );
}
