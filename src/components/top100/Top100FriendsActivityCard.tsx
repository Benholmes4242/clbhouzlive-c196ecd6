import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Top100FriendEntry {
  friend_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  total_top100_played: number;
}

interface Top100FriendsActivityCardProps {
  friends: Top100FriendEntry[];
  friendMessage: string | null;
  onViewLeaderboard: () => void;
}

const Top100FriendsActivityCard: React.FC<Top100FriendsActivityCardProps> = ({ 
  friends, 
  friendMessage,
  onViewLeaderboard 
}) => {
  // Default to expanded state
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();

  // Show top 10 friends sorted by total_top100_played
  const topFriends = friends
    .slice()
    .sort((a, b) => b.total_top100_played - a.total_top100_played)
    .slice(0, 10);

  const visibleEntries = isExpanded ? topFriends : topFriends.slice(0, 3);

  const getRankBadge = (index: number) => {
    const rank = index + 1;
    
    // Podium styling for ranks 1-3
    if (rank === 1) {
      return (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-[2px] text-xs font-semibold text-amber-700">
          #{rank}
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-[2px] text-xs font-semibold text-slate-700">
          #{rank}
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-[2px] text-xs font-semibold text-orange-600">
          #{rank}
        </span>
      );
    }
    
    // Ghost pill for ranks 4-10
    return (
      <span className="inline-flex items-center rounded-full border border-border/60 bg-background/40 px-2 py-[2px] text-xs font-medium text-muted-foreground">
        #{rank}
      </span>
    );
  };

  if (topFriends.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div className="text-left">
            <h3 className="text-base font-semibold text-foreground">Friends chasing the Top 100</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{friendMessage ?? 'Top players this period'}</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 mt-0.5" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 mt-0.5" />
          )}
        </div>
        
        {/* Top 10 pill on its own row */}
        <div className="flex justify-start mt-3">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-[2px] text-xs font-semibold text-amber-700">
            Top 10
          </span>
        </div>
      </button>

      {/* Leaderboard List */}
      <div className="border-t border-border/60">
        {visibleEntries.map((friend, index) => (
          <div
            key={friend.friend_id}
            onClick={() => navigate(`/profile/${friend.friend_id}?tab=top100`)}
            className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer border-b last:border-b-0 border-border/40"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SquircleAvatar
                size={40}
                src={friend.profile_photo_url}
                alt={friend.display_name ?? 'Friend'}
                fallback={(friend.display_name ?? 'F').charAt(0).toUpperCase()}
                thinRing
              />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {friend.display_name ?? 'Unknown golfer'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {friend.total_top100_played} Top 100 course{friend.total_top100_played !== 1 ? 's' : ''} played
                </p>
              </div>
            </div>

            {getRankBadge(index)}
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {!isExpanded && topFriends.length > 3 && (
        <div className="px-5 py-2 text-center border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            +{topFriends.length - 3} more player{topFriends.length - 3 !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  );
};

export default Top100FriendsActivityCard;
