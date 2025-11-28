import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus } from 'lucide-react';
import { formatHcp } from '@/lib/formatHcp';

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
  loading?: boolean;
  onFollowToggle: () => void;
}

export function GolferCard({ golfer, isFollowing, loading, onFollowToggle }: GolferCardProps) {
  const initials = golfer.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Avatar */}
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage src={golfer.profileImage} alt={golfer.displayName} />
        <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground truncate">
          {golfer.displayName}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          {golfer.homeClub && (
            <>
              <span className="truncate">{golfer.homeClub}</span>
              {golfer.handicap != null && <span>·</span>}
            </>
          )}
          {golfer.handicap != null && (
            <span className="whitespace-nowrap">HCP {formatHcp(golfer.handicap)}</span>
          )}
        </div>
      </div>

      {/* Follow Button */}
      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={onFollowToggle}
        disabled={loading}
        className="flex-shrink-0 h-8 px-3 rounded-lg"
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
    </div>
  );
}
