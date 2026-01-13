import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
    
    // Subtle label styling for ranks 1-3 (smaller, more "label" than "sticker")
    if (rank === 1) {
      return (
        <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50/80 px-1.5 py-px text-[10px] font-semibold text-amber-700">
          #{rank}
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-px text-[10px] font-semibold text-slate-600">
          #{rank}
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center rounded-full border border-orange-200/80 bg-orange-50/80 px-1.5 py-px text-[10px] font-semibold text-orange-600">
          #{rank}
        </span>
      );
    }
    
    // Ghost pill for ranks 4-10
    return (
      <span className="inline-flex items-center rounded-full border border-border/50 bg-background/40 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
        #{rank}
      </span>
    );
  };

  if (trimmedLeaderboard.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      {/* Header - Tighter padding */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors min-h-[56px] focus:outline-none focus:ring-1 focus:ring-slate-200/60"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 border border-amber-200/80">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">Friends activity</h3>
            <p className="text-[11px] text-muted-foreground">Top players this period</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span 
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            aria-label={`Showing top ${Math.min(10, trimmedLeaderboard.length)} players`}
          >
            Top {Math.min(10, trimmedLeaderboard.length)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
          )}
        </div>
      </button>

      {/* Leaderboard List - Tighter padding */}
      <ol className="border-t border-border/60" aria-label="Top players leaderboard">
        {visibleEntries.map((entry, index) => (
          <li
            key={entry.friendId}
            onClick={() => navigate(`/user/${entry.friendName}`)}
            className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer border-b last:border-b-0 border-border/40"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Squircle width={36} height={36} className="shrink-0">
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
                <p className="text-[11px] text-muted-foreground">
                  {entry.roundCount} round{entry.roundCount !== 1 ? 's' : ''} · Last played {formatDistanceToNow(new Date(entry.lastPlayedAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {getRankBadge(index)}
          </li>
        ))}
      </ol>

      {/* Show more indicator - with divider */}
      {!isExpanded && trimmedLeaderboard.length > 3 && (
        <>
          <div className="mx-4 h-px bg-slate-200/60" />
          <div className="px-4 py-2 text-center">
            <p className="text-[11px] text-muted-foreground">
              +{trimmedLeaderboard.length - 3} more player{trimmedLeaderboard.length - 3 !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

export default FriendsActivityCard;
