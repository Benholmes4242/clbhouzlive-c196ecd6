import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Trophy } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

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
        <div className="flex items-center gap-1.5 mb-4">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </span>
        </div>
        <motion.div 
          className="text-center py-6 px-4 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(15,23,42,0.05)' }}>
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No friends here yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] mx-auto">
            Follow golfers to compare progress on this Top 100.
          </p>
          <button
            onClick={() => navigate('/golferstofollow')}
            className="w-full max-w-[260px] h-11 rounded-2xl mt-4 text-sm font-semibold active:scale-[0.97] transition-transform"
            style={{ background: '#0F172A', color: '#ffffff' }}
          >
            Find golfers to follow
          </button>
        </motion.div>
      </section>
    );
  }
  
  // Check if all friends have 0 progress - contextual "be the first" state
  const allFriendsHaveZero = friends.every(f => f.playedOnList === 0);
  if (allFriendsHaveZero && currentUserPlayed === 0) {
    return (
      <section className="px-4">
        <div className="flex items-center gap-1.5 mb-4">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </span>
        </div>
        <motion.div 
          className="text-center py-6 px-4 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(15,23,42,0.05)' }}>
            <Trophy className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Be the first
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] mx-auto">
            Start rating courses to set the pace for your friends.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="w-full max-w-[260px] h-11 rounded-2xl mt-4 text-sm font-semibold active:scale-[0.97] transition-transform"
            style={{ background: '#0F172A', color: '#ffffff' }}
          >
            Explore courses
          </button>
        </motion.div>
      </section>
    );
  }



  return (
    <section>
      {/* Header - dispatch eyebrow */}
      <div className="px-4 flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-1">
            See how you stack up against friends.
          </p>
        </div>
        {friends.length > 8 && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-medium text-muted-foreground active:opacity-70 transition-opacity flex items-center gap-0.5 py-2 px-2 -mr-2 rounded-lg active:scale-[0.97]"
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
              className="flex-shrink-0 w-[76px] p-1.5 rounded-xl transition-all text-center active:scale-[0.95]"
              style={{
                background: '#ffffff',
                ...(isCurrentUser ? {
                  border: '1px solid #F7931E',
                  boxShadow: '0 0 0 2px rgba(247,147,30,0.20)',
                } : isClosestCompetitor ? {
                  border: '1px solid rgba(247,147,30,0.60)',
                  boxShadow: '0 0 8px rgba(247,147,30,0.25)',
                } : {
                  border: '1px solid rgba(15,23,42,0.10)',
                }),
              }}
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
                  className="absolute -bottom-0.5 -right-0.5 rounded flex items-center justify-center text-[8px] font-bold"
                  style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)', padding: '0 3px', color: '#94A3B8' }}
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
              <div className="mt-0.5 flex items-center justify-center gap-0.5 text-[9px] font-medium rounded-full px-1 py-0.5"
                 style={
                   isAhead ? { background: 'rgba(247,147,30,0.10)', color: '#F7931E' } :
                   isSame ? { background: 'rgba(15,23,42,0.05)', color: '#94A3B8' } :
                   isBehind ? { background: 'rgba(15,23,42,0.05)', color: '#94A3B8' } : {}
                 }>
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