import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import SquircleImage from '@/components/ui/SquircleImage';
import { useFollowUser } from '@/hooks/useFollowUser';
import { cn } from '@/lib/utils';

interface GolferCardProps {
  golfer: {
    id: string;
    displayName: string;
    username?: string;
    profileImage: string;
    homeClub?: string;
    handicap?: number | null;
    isFollowing?: boolean;
    friendStatus?: 'none' | 'pending' | 'friends';
  };
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
}

export function GolferCard({ golfer, onFollowToggle }: GolferCardProps) {
  const navigate = useNavigate();
  const { followUser, unfollowUser, loading } = useFollowUser();

  const handleFollowToggle = async () => {
    const newFollowingState = !golfer.isFollowing;
    const success = newFollowingState
      ? await followUser(golfer.id)
      : await unfollowUser(golfer.id);

    if (success && onFollowToggle) {
      onFollowToggle(golfer.id, newFollowingState);
    }
  };

  const handleCardClick = () => {
    navigate(`/users/${golfer.id}`);
  };

  return (
    <article className="flex items-center justify-between rounded-2xl border border-border bg-card shadow-sm px-4 py-3 hover:bg-muted/30 transition-colors">
      <button
        onClick={handleCardClick}
        className="flex items-center gap-3 min-w-0 text-left flex-1"
      >
        <SquircleImage
          src={golfer.profileImage || '/placeholder.svg'}
          alt={golfer.displayName}
          size={52}
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
            {golfer.handicap != null ? `HCP ${golfer.handicap}` : 'Handicap not set'}
          </div>
        </div>
      </button>

      <div className="flex flex-col gap-1.5 ml-3 shrink-0">
        {/* Follow button */}
        <Button
          disabled={loading}
          onClick={handleFollowToggle}
          size="sm"
          className={cn(
            "h-9 px-4 text-sm font-medium rounded-lg",
            golfer.isFollowing
              ? "border-border bg-background text-foreground hover:bg-muted/60"
              : "border-primary text-primary bg-background hover:bg-primary/5"
          )}
          variant={golfer.isFollowing ? "outline" : "outline"}
        >
          {golfer.isFollowing ? (
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

        {/* Friend button */}
        <Button
          disabled={golfer.friendStatus === 'pending' || golfer.friendStatus === 'friends'}
          size="sm"
          className={cn(
            "h-8 px-3 text-xs font-medium rounded-lg",
            golfer.friendStatus === 'friends'
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 cursor-default"
              : golfer.friendStatus === 'pending'
              ? "border-border bg-muted/40 text-muted-foreground cursor-default"
              : "border-border text-muted-foreground hover:bg-muted/50"
          )}
          variant="outline"
        >
          {golfer.friendStatus === 'friends' ? 'Friends' : golfer.friendStatus === 'pending' ? 'Request sent' : 'Add friend'}
        </Button>
      </div>
    </article>
  );
}
