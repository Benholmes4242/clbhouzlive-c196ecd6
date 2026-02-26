import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FriendLeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  playedOnList: number;
  totalTop100Played?: number;
}

interface Top100ListLeaderboardProps {
  friends: FriendLeaderboardEntry[];
  totalInList: number;
  listName: string;
  currentUserPlayed: number;
  onViewAll?: () => void;
}

/**
 * Social leaderboard showing friends' progress with relative position indicators.
 */
export const Top100ListLeaderboard: React.FC<Top100ListLeaderboardProps> = ({
  friends,
  totalInList,
  listName,
  currentUserPlayed,
  onViewAll,
}) => {
  const navigate = useNavigate();

  // Sort friends by played count descending
  const sortedFriends = [...friends].sort((a, b) => b.playedOnList - a.playedOnList);

  // Contextual empty states based on friend/list conditions
  if (friends.length === 0) {
    return (
      <section className="px-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-4">
          Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
        </h2>
        <motion.div 
          className="text-center py-6 px-4 rounded-sq-md bg-card border border-border/60"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No friends here yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] mx-auto">
            Follow golfers to compare progress on this Top 100.
          </p>
          <Button
            onClick={() => navigate('/golferstofollow')}
            className="w-full max-w-[260px] h-11 rounded-sq-sm mt-4"
          >
            Find golfers to follow
          </Button>
        </motion.div>
      </section>
    );
  }
  
  // Check if all friends have 0 progress - contextual "be the first" state
  const allFriendsHaveZero = friends.every(f => f.playedOnList === 0);
  if (allFriendsHaveZero && currentUserPlayed === 0) {
    return (
      <section className="px-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-4">
          Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
        </h2>
        <motion.div 
          className="text-center py-6 px-4 rounded-sq-md bg-card border border-border/60"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            Be the first
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] mx-auto">
            Start rating courses to set the pace for your friends.
          </p>
          <Button
            onClick={() => navigate('/courses')}
            className="w-full max-w-[260px] h-11 rounded-sq-sm mt-4"
          >
            Explore courses
          </Button>
        </motion.div>
      </section>
    );
  }



  return (
    <section>
      {/* Header - small caps styling */}
      <div className="px-4 flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground/60">
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </h2>
          <p className="text-[11px] text-muted-foreground/50 mt-1">
            See how you stack up against friends.
          </p>
        </div>
        {friends.length > 8 && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 py-2 px-2 -mr-2 rounded-lg active:scale-[0.97] transition-transform"
          >
            View all
            <span className="text-[10px]">→</span>
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none pl-4">
        {sortedFriends.slice(0, 10).map((friend, index) => {
          // Calculate relative position
          const diff = friend.playedOnList - currentUserPlayed;
          const isAhead = diff > 0;
          const isBehind = diff < 0;
          const isSame = diff === 0;
          
          // Highlight closest competitor (smallest non-zero diff)
          const isClosestCompetitor = sortedFriends
            .filter(f => f.playedOnList !== currentUserPlayed)
            .sort((a, b) => Math.abs(a.playedOnList - currentUserPlayed) - Math.abs(b.playedOnList - currentUserPlayed))[0]?.id === friend.id;

          // Highlight current user (first position) with ring
          const isCurrentUser = index === 0;

          return (
            <motion.button
              key={friend.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigate(`/profile/${friend.username}`)}
              className={`
                flex-shrink-0 w-[76px] p-1.5 rounded-xl bg-card border transition-all text-center active:scale-[0.95]
                ${isCurrentUser ? 'border-[#D4A853] ring-2 ring-[#D4A853]/20' : ''}
                ${isClosestCompetitor && !isCurrentUser ? 'border-[#D4A853]/60 shadow-[0_0_8px_rgba(212,168,83,0.25)]' : ''}
                ${!isCurrentUser && !isClosestCompetitor ? 'border-border/60' : ''}
              `}
            >
              {/* Avatar - no border ring per avatar-border-removal-policy */}
              <div className="relative mx-auto mb-1">
                <SquircleAvatar
                  size={40}
                  src={friend.avatarUrl}
                  alt={friend.name}
                  fallback={friend.name[0]?.toUpperCase() || '?'}
                />
                {/* Mini progress badge */}
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-foreground flex items-center justify-center text-[8px] font-bold text-background"
                  title={`${friend.playedOnList}/${totalInList} played`}
                >
                  {friend.playedOnList}
                </div>
              </div>

              {/* Name - centered, truncated */}
              <div className="text-[11px] font-medium text-foreground truncate px-0.5">
                {friend.name.split(' ')[0]}
              </div>

              {/* Relative position indicator */}
              <div className={`
                mt-0.5 flex items-center justify-center gap-0.5 text-[9px] font-medium rounded-full px-1 py-0.5
                ${isAhead ? 'bg-emerald-50 text-emerald-600' : ''}
                ${isBehind ? 'bg-rose-50 text-rose-500' : ''}
                ${isSame ? 'bg-amber-50 text-amber-600' : ''}
              `}>
                {isAhead && (
                  <>
                    <ArrowUp className="w-2 h-2" />
                    <span>+{diff}</span>
                  </>
                )}
                {isBehind && (
                  <>
                    <ArrowDown className="w-2 h-2" />
                    <span>{diff}</span>
                  </>
                )}
                {isSame && (
                  <>
                    <Minus className="w-2 h-2" />
                    <span>Tied</span>
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
        {/* End spacer to match right padding */}
        <div className="flex-shrink-0 w-2" aria-hidden="true" />
      </div>
    </section>
  );
};