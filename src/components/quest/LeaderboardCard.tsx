/**
 * LeaderboardCard - Friends Leaderboard for Quest page
 * V3: Shows only users the current user follows, with friendly empty state
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface LeaderboardCardProps {
  userId: string | undefined;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: friends = [], isLoading, isError } = useFriendsLeaderboard(userId);

  // Sort friends by courses played and add ranks
  const rankedFriends = useMemo(() => {
    return [...friends]
      .sort((a, b) => b.coursesPlayed - a.coursesPlayed)
      .map((friend, index) => ({
        ...friend,
        rank: index + 1,
        displayName: friend.display_name || friend.username || 'Golfer',
        avatarUrl: friend.profile_photo_url || null,
        totalPlayed: friend.coursesPlayed,
      }));
  }, [friends]);

  // Loading state
  if (isLoading) {
    return (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-4">
          Friends Leaderboard
        </h2>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                <div className="w-8 h-8 bg-slate-100 rounded-full" />
                <div className="flex-1 h-4 bg-slate-100 rounded" />
                <div className="w-8 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error or no user
  if (isError || !userId) {
    return null;
  }

  // Empty state - no friends or no friends with Top 100 courses
  if (rankedFriends.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-4">
          Friends Leaderboard
        </h2>
        <div className="bg-white rounded-2xl p-8 border border-slate-200/60 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-[#64748b]" />
          </div>
          <h3 className="text-base font-bold text-[#1e293b] mb-2">
            Add friends to see how you compare!
          </h3>
          <p className="text-sm text-[#64748b] mb-4 max-w-[280px] mx-auto">
            Connect with other golfers to track their Top 100 journey alongside yours
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#334E3D] text-white hover:bg-[#2a4033] transition-colors"
          >
            <Users className="w-4 h-4" />
            Find Golfers
          </button>
        </div>
      </section>
    );
  }

  const top3 = rankedFriends.slice(0, 3);
  const remaining = rankedFriends.slice(3, 10);

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
        return { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)', color: '#64748b' };
    }
  };

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-4">
        Friends Leaderboard
      </h2>
      
      <div className="bg-white rounded-2xl p-4 border border-slate-200/60">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top 3 list */}
          <div className="space-y-2">
            {top3.map((entry, index) => {
              const rankStyle = getRankStyle(entry.rank);
              
              return (
                <motion.div
                  key={entry.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Rank badge */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: rankStyle.bg,
                      border: `1px solid ${rankStyle.border}`,
                    }}
                  >
                    {entry.rank <= 3 ? (
                      <Medal className="w-4 h-4" style={{ color: rankStyle.color }} />
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
                    size={36}
                    src={entry.avatarUrl || undefined}
                    alt={entry.displayName}
                    fallback={entry.displayName.charAt(0).toUpperCase()}
                  />

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-[#1e293b]">
                      {entry.displayName}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Trophy className="w-4 h-4 text-[#C1A84C]" />
                    <span className="text-sm font-bold text-[#1e293b]">
                      {entry.totalPlayed}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Remaining entries (4-10) - compact list */}
          {remaining.length > 0 && (
            <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
              {remaining.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  className="flex items-center gap-3 py-1.5 px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 + index * 0.03 }}
                >
                  <span className="w-6 text-xs font-medium text-[#94a3b8] text-center">
                    {entry.rank}
                  </span>
                  <SquircleAvatar
                    size={28}
                    src={entry.avatarUrl || undefined}
                    alt={entry.displayName}
                    fallback={entry.displayName.charAt(0).toUpperCase()}
                  />
                  <span className="flex-1 text-sm truncate text-[#64748b]">
                    {entry.displayName}
                  </span>
                  <span className="text-sm font-medium text-[#64748b]">
                    {entry.totalPlayed}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default LeaderboardCard;
