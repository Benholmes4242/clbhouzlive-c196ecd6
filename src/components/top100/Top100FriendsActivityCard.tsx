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
        <span className="inline-flex items-center rounded-full px-2 py-[2px] text-xs font-semibold" style={{ background: 'rgba(247,147,30,0.10)', color: '#F7931E', border: '1px solid rgba(247,147,30,0.30)' }}>
          #{rank}
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center rounded-full border border-[#A8B4C0]/30 bg-[#A8B4C0]/10 px-2 py-[2px] text-xs font-semibold text-[#A8B4C0]">
          #{rank}
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center rounded-full border border-[#C4956A]/30 bg-[#C4956A]/10 px-2 py-[2px] text-xs font-semibold text-[#C4956A]">
          #{rank}
        </span>
      );
    }
    
    // Ghost pill for ranks 4-10
    return (
      <span className="inline-flex items-center rounded-full px-2 py-[2px] text-xs font-medium" style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)', color: '#94A3B8' }}>
        #{rank}
      </span>
    );
  };

  if (topFriends.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full px-5 py-4 active:bg-muted/30 active:scale-[0.98] transition-all"
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
          <span className="inline-flex items-center rounded-full px-2.5 py-[2px] text-xs font-semibold" style={{ background: 'rgba(247,147,30,0.10)', color: '#F7931E', border: '1px solid rgba(247,147,30,0.30)' }}>
            Top 10
          </span>
        </div>
      </button>

      {/* Leaderboard List */}
      <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
        {visibleEntries.map((friend, index) => (
          <div
            key={friend.friend_id}
            onClick={() => navigate(`/profile/${friend.friend_id}?tab=top100`)}
            className="px-5 py-3 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
            style={{ borderBottom: index < visibleEntries.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}
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
        <div className="px-5 py-2 text-center" style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          <p className="text-xs text-muted-foreground">
            +{topFriends.length - 3} more player{topFriends.length - 3 !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  );
};

export default Top100FriendsActivityCard;
