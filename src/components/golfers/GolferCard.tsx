import React from 'react';
import { useNavigate } from 'react-router-dom';
import SquircleImage from '@/components/ui/SquircleImage';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus, UserRoundPlus } from 'lucide-react';
import { formatHcp } from '@/lib/formatHcp';
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
  isFriend?: boolean;
  loading?: boolean;
  onFollowToggle: () => void;
  onFriendRequest?: () => void;
}

export function GolferCard({ 
  golfer, 
  isFollowing, 
  isFriend = false,
  loading, 
  onFollowToggle,
  onFriendRequest
}: GolferCardProps) {
  const navigate = useNavigate();

  return (
    <article className="flex items-center justify-between rounded-2xl border border-border bg-card shadow-sm px-4 py-3 hover:shadow-md transition-shadow">
      {/* Left side - clickable to profile */}
      <button
        onClick={() => navigate(`/users/${golfer.id}`)}
        className="flex items-center gap-3 min-w-0 text-left flex-1"
      >
        {/* Squircle Avatar */}
        <SquircleImage
          size={52}
          src={golfer.profileImage || ''}
          alt={golfer.displayName}
          className="flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="font-medium truncate text-foreground">
            {golfer.displayName}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground truncate">
            {golfer.homeClub || 'No home club set'}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {golfer.handicap != null ? `HCP ${formatHcp(golfer.handicap)}` : 'Handicap not set'}
          </div>
        </div>
      </button>

      {/* Right side - stacked buttons */}
      <div className="flex flex-col gap-1.5 ml-3 shrink-0">
        {/* Follow Button */}
        <Button
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          onClick={onFollowToggle}
          disabled={loading}
          className={cn(
            "h-9 px-4 rounded-lg text-sm font-medium transition",
            isFollowing 
              ? "border-border bg-background text-foreground hover:bg-muted/60"
              : "border-primary text-primary hover:bg-primary/5"
          )}
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
            onClick={onFriendRequest}
            disabled={loading || isFriend}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-medium transition",
              isFriend
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 cursor-default"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {isFriend ? (
              'Friends'
            ) : (
              <>
                <UserRoundPlus className="w-3 h-3 mr-1.5" />
                Add friend
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
