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

  const visibleEntries = isExpanded ? leaderboard : leaderboard.slice(0, 3);

  const getRankBadge = (index: number) => {
    const rank = index + 1;
    const badges = {
      1: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
      2: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
      3: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
    };
    
    const style = badges[rank as keyof typeof badges] || { 
      bg: 'bg-muted', 
      border: 'border-border', 
      text: 'text-muted-foreground' 
    };

    return (
      <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border ${style.bg} ${style.border}`}>
        <span className={`text-xs font-semibold ${style.text}`}>#{rank}</span>
      </div>
    );
  };

  if (leaderboard.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
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
          {getRankBadge(0)}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
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
      {!isExpanded && leaderboard.length > 3 && (
        <div className="px-5 py-2 text-center border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            +{leaderboard.length - 3} more player{leaderboard.length - 3 !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  );
};

export default FriendsActivityCard;
