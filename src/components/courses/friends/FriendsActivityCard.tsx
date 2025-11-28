import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface LeaderboardEntry {
  friendId: string;
  friendName: string;
  avatarUrl: string | null;
  roundCount: number;
  lastPlayedAt: string;
}

interface FriendsActivityCardProps {
  leaderboard: LeaderboardEntry[];
  timeframe: string;
}

const FriendsActivityCard: React.FC<FriendsActivityCardProps> = ({ leaderboard, timeframe }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Limit to max 10 entries
  const trimmedLeaderboard = leaderboard.slice(0, 10);
  const visibleEntries = isExpanded ? trimmedLeaderboard : trimmedLeaderboard.slice(0, 3);

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

  if (trimmedLeaderboard.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors min-h-[64px]"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-50 border border-amber-200">
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-foreground">Friends activity</h3>
            <p className="text-xs text-muted-foreground">Top players this period</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-[2px] text-xs font-semibold text-amber-700">
            Top 10
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
          )}
        </div>
      </button>

      {/* Leaderboard List */}
      <div className="border-t border-border/60">
        {visibleEntries.map((entry, index) => (
          <div
            key={entry.friendId}
            onClick={() => navigate(`/user/${entry.friendName}`)}
            className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer border-b last:border-b-0 border-border/40"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Squircle width={40} height={40} className="shrink-0">
                <img 
                  src={entry.avatarUrl || '/placeholder.svg'} 
                  alt={entry.friendName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </Squircle>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{entry.friendName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.roundCount} round{entry.roundCount !== 1 ? 's' : ''} · Last played {formatDistanceToNow(new Date(entry.lastPlayedAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {getRankBadge(index)}
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {!isExpanded && trimmedLeaderboard.length > 3 && (
        <div className="px-5 py-2 text-center border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            +{trimmedLeaderboard.length - 3} more player{trimmedLeaderboard.length - 3 !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  );
};

export default FriendsActivityCard;
