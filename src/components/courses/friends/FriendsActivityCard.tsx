import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
        <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        {/* Header - Tighter padding */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 active:scale-[0.98] transition-all min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          aria-expanded={isExpanded}
          aria-controls="leaderboard-list"
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
              className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              aria-label={`Showing top ${Math.min(10, trimmedLeaderboard.length)} players`}
            >
              Top {Math.min(10, trimmedLeaderboard.length)}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Leaderboard List - Proper semantics */}
        <ol 
          id="leaderboard-list"
          className="border-t border-border/60" 
          aria-label="Top players leaderboard"
        >
          <AnimatePresence mode="sync">
            {visibleEntries.map((entry, index) => (
              <motion.li
                key={entry.friendId}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: isExpanded ? index * 0.02 : 0 }}
                onClick={() => navigate(`/profile/${entry.friendId}`)}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/40 active:bg-muted/60 active:scale-[0.98] transition-all cursor-pointer border-b last:border-b-0 border-border/40"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Squircle width={36} height={36} className="shrink-0 ring-1 ring-border/30">
                    <img 
                      src={entry.avatarUrl || '/placeholder.svg'} 
                      alt={`${entry.friendName}'s profile`}
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
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>

        {/* Show more indicator - with divider */}
        {!isExpanded && trimmedLeaderboard.length > 3 && (
          <>
            <div className="mx-4 h-px bg-border/60" />
            <button 
              onClick={() => setIsExpanded(true)}
              className="w-full px-4 py-2.5 text-center hover:bg-muted/30 active:scale-[0.97] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <p className="text-[11px] text-primary font-medium">
                +{trimmedLeaderboard.length - 3} more player{trimmedLeaderboard.length - 3 !== 1 ? 's' : ''}
              </p>
            </button>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default FriendsActivityCard;
