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
    <article className="flex items-center justify-between rounded-2xl bg-white shadow-sm px-4 py-4">
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
        {/* Follow Button - Primary */}
        <button
          type="button"
          onClick={onFollowToggle}
          disabled={loading}
          className={cn(
            "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
            isFollowing
              ? "bg-slate-900 text-white"
              : "bg-slate-800 text-white hover:bg-slate-900"
          )}
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        {/* Friend Request Button - Secondary */}
        {onFriendRequest && (
          <button
            type="button"
            onClick={friendStatus === 'pending' ? undefined : onFriendRequest}
            disabled={loading || friendStatus === 'pending'}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              friendStatus === 'pending'
                ? "border border-slate-300 bg-slate-50/80 text-slate-500 cursor-default"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            )}
          >
            <UserRoundPlus className="mr-1.5 h-3.5 w-3.5" />
            {friendStatus === 'pending' ? 'Pending' : 'Add friend'}
          </button>
        )}
      </div>
    </article>
  );
}
