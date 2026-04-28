/**
 * LeaderboardCard - Friends Leaderboard for Quest page
 * V4: Includes current user ("You") row with highlight
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface LeaderboardCardProps {
  userId: string | undefined;
  totalPlayed?: number;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ userId, totalPlayed = 0 }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { profile } = useProfileData();
  const { data: friends = [], isLoading, isError } = useFriendsLeaderboard(userId);

  // Sort friends + current user by courses played and add ranks
  const rankedEntries = useMemo(() => {
    const entries = [
      ...friends.map(friend => ({
        id: friend.id || '',
        displayName: friend.display_name || friend.username || 'Golfer',
        avatarUrl: friend.profile_photo_url || null,
        totalPlayed: friend.coursesPlayed,
        isCurrentUser: false,
      })),
    ];

    // Insert current user with real profile data
    if (user?.id) {
      const p = profile as any;
      const realName = p?.display_name || p?.username || 'You';
      entries.push({
        id: user.id,
        displayName: realName,
        avatarUrl: p?.profile_photo_url || null,
        totalPlayed,
        isCurrentUser: true,
      });
    }

    return entries
      .sort((a, b) => b.totalPlayed - a.totalPlayed)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [friends, user?.id, totalPlayed, profile]);

  // Loading state
  if (isLoading) {
    return (
      <section>
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Leaderboard</span>
          </div>
          <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>Friends Leaderboard</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(15,23,42,0.08)' }} />
              <div className="w-8 h-8 rounded-full" style={{ background: 'rgba(15,23,42,0.08)' }} />
              <div className="flex-1 h-4 rounded" style={{ background: 'rgba(15,23,42,0.06)' }} />
              <div className="w-8 h-4 rounded" style={{ background: 'rgba(15,23,42,0.06)' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error or no user
  if (isError || !userId) {
    return null;
  }

  // Empty state (only current user, no friends)
  if (friends.length === 0) {
    return (
      <section>
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Leaderboard</span>
          </div>
          <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>Friends Leaderboard</h2>
        </div>
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
            <UserPlus className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-2">
            Add friends to see how you compare!
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-[280px] mx-auto">
            Connect with other golfers to track their Top 100 journey alongside yours
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-full text-sm font-semibold bg-[#334E3D] text-white hover:bg-[#2a4033] transition-colors active:scale-[0.98]"
          >
            <Users className="w-4 h-4" />
            Find Golfers
          </button>
        </div>
      </section>
    );
  }

  const top3 = rankedEntries.slice(0, 3);
  const remaining = rankedEntries.slice(3, 10);

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
        return { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)', color: 'hsl(var(--muted-foreground))' };
    }
  };

  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Leaderboard</span>
        </div>
        <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>Friends Leaderboard</h2>
      </div>
      
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
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl min-h-[44px] active:opacity-80 transition-opacity",
                )}
                style={entry.isCurrentUser ? { background: 'rgba(247,147,30,0.06)', border: '1px solid rgba(247,147,30,0.25)' } : undefined}
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
                    <span className="text-xs font-bold text-muted-foreground">
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
                  <p className="text-sm font-semibold truncate text-foreground"
                    style={entry.isCurrentUser ? { color: '#F7931E' } : undefined}
                  >
                    {entry.displayName}
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Trophy className="w-4 h-4 text-[#C1A84C]" />
                  <span className="text-sm font-bold text-foreground">
                    {entry.totalPlayed}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Remaining entries (4-10) - compact list */}
        {remaining.length > 0 && (
          <div className="pt-3 mt-3 space-y-1" style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            {remaining.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="flex items-center gap-3 py-1.5 px-2 min-h-[44px] active:opacity-80 transition-opacity rounded-lg"
                style={entry.isCurrentUser ? { background: 'rgba(247,147,30,0.06)', border: '1px solid rgba(247,147,30,0.25)' } : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + index * 0.03 }}
              >
                <span className="w-6 text-xs font-medium text-muted-foreground text-center">
                  {entry.rank}
                </span>
                <SquircleAvatar
                  size={28}
                  src={entry.avatarUrl || undefined}
                  alt={entry.displayName}
                  fallback={entry.displayName.charAt(0).toUpperCase()}
                />
                <span className={cn(
                  "flex-1 text-sm truncate text-muted-foreground",
                  entry.isCurrentUser && "font-semibold"
                )}
                  style={entry.isCurrentUser ? { color: '#F7931E' } : undefined}
                >
                  {entry.displayName}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {entry.totalPlayed}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default LeaderboardCard;
