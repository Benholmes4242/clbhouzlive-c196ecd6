/**
 * LeaderboardCard - Mini leaderboard for Top 100 Quest
 * Shows top 3 users and current user's position
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Users } from 'lucide-react';
import { useQuestLeaderboard } from '@/hooks/useQuestLeaderboard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface LeaderboardCardProps {
  userId: string | undefined;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ userId }) => {
  const { data: leaderboard, isLoading, isError } = useQuestLeaderboard(userId);

  // Don't show if loading, errored, or no entries
  if (isLoading || isError || !leaderboard || leaderboard.entries.length === 0) {
    return null;
  }

  const { entries, userRank, userTotal, behindTenth } = leaderboard;
  const top3 = entries.slice(0, 3);
  const isUserInTop10 = userRank !== null && userRank <= 10;

  // Rank medal colors
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: 'rgba(255, 215, 0, 0.15)', border: 'rgba(255, 215, 0, 0.3)', color: '#D4AF37' };
      case 2:
        return { bg: 'rgba(192, 192, 192, 0.15)', border: 'rgba(192, 192, 192, 0.3)', color: '#A0A0A0' };
      case 3:
        return { bg: 'rgba(205, 127, 50, 0.15)', border: 'rgba(205, 127, 50, 0.3)', color: '#CD7F32' };
      default:
        return { bg: 'var(--quest-chip-bg)', border: 'var(--quest-stroke)', color: 'var(--quest-text-secondary)' };
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Leaderboard</h2>
      
      <motion.div
        className="py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top 3 list */}
        <div className="space-y-2 mb-4">
          {top3.map((entry, index) => {
            const rankStyle = getRankStyle(entry.rank);
            const isCurrentUser = entry.userId === userId;
            
            return (
              <motion.div
                key={entry.userId}
                className="flex items-center gap-3 p-2 rounded-xl transition-all"
                style={{
                  background: isCurrentUser ? 'rgba(110, 146, 119, 0.08)' : 'transparent',
                  border: isCurrentUser ? '1px solid rgba(110, 146, 119, 0.2)' : '1px solid transparent',
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Rank badge */}
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: rankStyle.bg,
                    border: `1px solid ${rankStyle.border}`,
                  }}
                >
                  {entry.rank <= 3 ? (
                    <Medal className="w-3.5 h-3.5" style={{ color: rankStyle.color }} />
                  ) : (
                    <span 
                      className="text-xs font-bold"
                      style={{ color: rankStyle.color }}
                    >
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <SquircleAvatar
                  size={32}
                  src={entry.avatarUrl || undefined}
                  alt={entry.displayName}
                  fallback={entry.displayName.charAt(0).toUpperCase()}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--quest-text-primary)' }}
                  >
                    {isCurrentUser ? 'You' : entry.displayName}
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--quest-accent-gold)' }} />
                  <span 
                    className="text-sm font-bold"
                    style={{ color: 'var(--quest-text-primary)' }}
                  >
                    {entry.totalPlayed}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* User position or behind info */}
        {userId && (
          <div 
            className="pt-3 border-t"
            style={{ borderColor: 'var(--quest-stroke)' }}
          >
            {isUserInTop10 ? (
              <div className="flex items-center justify-center gap-2">
                <span 
                  className="text-xs font-medium"
                  style={{ color: 'var(--quest-accent-green)' }}
                >
                  🎉 You're ranked #{userRank}!
                </span>
              </div>
            ) : userRank ? (
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" style={{ color: 'var(--quest-text-tertiary)' }} />
                <span 
                  className="text-xs"
                  style={{ color: 'var(--quest-text-secondary)' }}
                >
                  Your rank: <span className="font-semibold">#{userRank}</span>
                  {behindTenth !== null && behindTenth > 0 && (
                    <span style={{ color: 'var(--quest-text-tertiary)' }}>
                      {' '}· {behindTenth} behind top 10
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span 
                  className="text-xs"
                  style={{ color: 'var(--quest-text-tertiary)' }}
                >
                  Log Top 100 courses to join the leaderboard
                </span>
              </div>
            )}
          </div>
        )}

        {/* View full leaderboard CTA (future) */}
        {/* 
        <button 
          className="w-full flex items-center justify-center gap-2 mt-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-black/5"
          style={{ color: 'var(--quest-text-secondary)' }}
          onClick={() => navigate('/leaderboard')}
        >
          <span>View full leaderboard</span>
          <ChevronRight className="w-4 h-4" />
        </button>
        */}
      </motion.div>
    </section>
  );
};

export default LeaderboardCard;
