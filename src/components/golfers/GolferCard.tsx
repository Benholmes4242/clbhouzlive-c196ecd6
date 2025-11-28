import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus, UserRoundPlus, Clock } from 'lucide-react';
import { GolferAvatar } from './GolferAvatar';
import { cn } from '@/lib/utils';

interface GolferCardProps {
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

export function GolferCard({ 
  golfer, 
  isFollowing, 
  friendStatus = 'none',
  loading, 
  onFollowToggle,
  onFriendRequest
}: GolferCardProps) {
  const navigate = useNavigate();

  // Build separate lines for club and handicap
  const clubLine = golfer.homeClub || 'No home club set';
  const handicapLine = golfer.handicap != null ? `HCP ${golfer.handicap.toFixed(1)}` : null;

  return (
    <article className="flex items-center justify-between rounded-2xl border border-border bg-card shadow-sm px-4 py-3 hover:shadow-md transition-shadow">
      {/* Left side - clickable to profile */}
      <button
        onClick={() => navigate(`/users/${golfer.id}`)}
        className="flex items-center gap-3 min-w-0 text-left flex-1"
      >
        {/* Squircle Avatar with initials fallback */}
        <GolferAvatar
          name={golfer.displayName}
          photoUrl={golfer.profileImage}
          size={56}
        />

        <div className="min-w-0 flex-1">
          <div className="font-medium truncate text-foreground">
            {golfer.displayName}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground truncate">
            {clubLine}
          </div>
          {handicapLine && (
            <div className="mt-0.5 text-sm text-muted-foreground truncate">
              {handicapLine}
            </div>
          )}
        </div>
      </button>

      {/* Right side - stacked buttons with fixed width */}
      <div className="flex flex-col gap-2 ml-3 shrink-0 w-[110px]">
        {/* Follow Button - Lighter secondary style */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onFollowToggle}
          disabled={loading}
          className="h-9 w-full rounded-lg text-sm font-medium"
        >
          {isFollowing ? (
            <>
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Follow
            </>
          )}
        </Button>

        {/* Friend Request Button */}
        {onFriendRequest && (
          <Button
            variant="outline"
            size="sm"
            onClick={friendStatus === 'pending' ? undefined : onFriendRequest}
            disabled={loading || friendStatus === 'pending'}
            className={cn(
              "h-9 w-full rounded-lg text-sm font-medium transition",
              friendStatus === 'pending'
                ? "border-slate-300 bg-slate-50/80 text-slate-500 cursor-default"
                : "border-slate-600 text-foreground hover:bg-slate-50"
            )}
          >
            {friendStatus === 'pending' ? (
              <>
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Pending
              </>
            ) : (
              <>
                <UserRoundPlus className="w-3.5 h-3.5 mr-1.5" />
                Add friend
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
