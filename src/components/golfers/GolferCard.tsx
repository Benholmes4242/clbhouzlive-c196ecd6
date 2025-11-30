import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus, UserRoundPlus, Clock, ChevronRight } from 'lucide-react';
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
    <article className="flex items-center justify-between rounded-xl bg-white border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-4 py-4">
      {/* Left side - tappable to profile */}
      <button
        type="button"
        onClick={() => navigate(`/users/${golfer.id}`)}
        className="flex flex-1 items-center gap-3 text-left"
      >
        {/* Squircle Avatar with initials fallback */}
        <GolferAvatar
          name={golfer.displayName}
          photoUrl={golfer.profileImage}
          size={48}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-semibold text-slate-900 truncate">
              {golfer.displayName}
            </p>
            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
          </div>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {clubLine}
          </p>
          {handicapLine && (
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {handicapLine}
            </p>
          )}
        </div>
      </button>

      {/* Right side - stacked buttons */}
      <div className="ml-3 flex flex-col items-end gap-2">
        {/* Follow Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onFollowToggle}
          disabled={loading}
          className={cn(
            "h-7 px-3.5 text-xs",
            isFollowing && "border-[rgba(247,158,27,0.65)] bg-[rgba(247,158,27,0.10)] text-[rgba(247,158,27,1)] hover:bg-[rgba(247,158,27,0.16)] active:bg-[rgba(247,158,27,0.22)]"
          )}
        >
          <UserPlus className={cn("mr-1.5 h-3.5 w-3.5", isFollowing && "text-[rgba(247,158,27,1)]")} />
          {isFollowing ? 'Following' : 'Follow'}
        </Button>

        {/* Friend Request Button */}
        {onFriendRequest && (
          <Button
            variant="secondary"
            size="sm"
            onClick={friendStatus === 'pending' ? undefined : onFriendRequest}
            disabled={loading || friendStatus === 'pending'}
            className={cn(
              "h-7 px-3.5 text-xs",
              friendStatus === 'pending' && "opacity-50 cursor-default"
            )}
          >
            <UserRoundPlus className="mr-1.5 h-3.5 w-3.5" />
            {friendStatus === 'pending' ? 'Pending' : 'Add friend'}
          </Button>
        )}
      </div>
    </article>
  );
}
