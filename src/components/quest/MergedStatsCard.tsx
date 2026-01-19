/**
 * MergedStatsCard - Combined Momentum + Leaderboard in split card
 * Two columns, 50% vertical spacing reduction
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Trophy, Medal } from 'lucide-react';
import { useQuestLeaderboard } from '@/hooks/useQuestLeaderboard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface MergedStatsCardProps {
  userId: string | undefined;
  recentlyPlayed: {
    id: string;
    name: string;
    dateAdded?: string;
  }[];
}

export const MergedStatsCard: React.FC<MergedStatsCardProps> = ({
  userId,
  recentlyPlayed,
}) => {
  const { data: leaderboard } = useQuestLeaderboard(userId);

  // Calculate momentum stats
  const { lastCourseDate, thisMonthCount, hasActivity } = useMemo(() => {
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
      return { lastCourseDate: null, thisMonthCount: 0, hasActivity: false };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let latestDate: Date | null = null;
    let monthCount = 0;

    for (const course of recentlyPlayed) {
      if (!course.dateAdded) continue;
      
      const parts = course.dateAdded.split(' ');
      if (parts.length !== 2) continue;
      
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      
      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      };
      
      const month = monthMap[monthStr];
      if (month === undefined || isNaN(day)) continue;
      
      let year = currentYear;
      if (month > currentMonth) year = currentYear - 1;
      
      const courseDate = new Date(year, month, day);
      
      if (!latestDate || courseDate > latestDate) latestDate = courseDate;
      if (courseDate.getMonth() === currentMonth && courseDate.getFullYear() === currentYear) {
        monthCount++;
      }
    }

    return {
      lastCourseDate: latestDate,
      thisMonthCount: monthCount,
      hasActivity: latestDate !== null,
    };
  }, [recentlyPlayed]);

  // Format last course date
  const formatLastDate = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const top3 = leaderboard?.entries?.slice(0, 3) || [];
  const userRank = leaderboard?.userRank;
  const isUserInTop10 = userRank !== null && userRank !== undefined && userRank <= 10;

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return { bg: 'rgba(255, 215, 0, 0.12)', color: '#D4AF37' };
      case 2: return { bg: 'rgba(192, 192, 192, 0.12)', color: '#9CA3AF' };
      case 3: return { bg: 'rgba(205, 127, 50, 0.12)', color: '#CD7F32' };
      default: return { bg: 'var(--quest-chip-bg)', color: 'var(--quest-text-secondary)' };
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-slate-200/70 overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        {/* Left column: Momentum */}
        <div className="p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Momentum
          </h3>
          
          {hasActivity ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: 'rgba(110, 146, 119, 0.1)' }}
                >
                  <Calendar className="w-3 h-3" style={{ color: 'var(--quest-accent-green)' }} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Last logged</p>
                  <p className="text-xs font-semibold text-slate-700">{formatLastDate(lastCourseDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: 'rgba(210, 180, 97, 0.1)' }}
                >
                  <TrendingUp className="w-3 h-3" style={{ color: 'var(--quest-accent-gold)' }} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">This month</p>
                  <p className="text-xs font-semibold text-slate-700">{thisMonthCount} courses</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              Log a course to start tracking
            </p>
          )}
        </div>

        {/* Right column: Leaderboard */}
        <div className="p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Leaderboard
          </h3>
          
          {top3.length > 0 ? (
            <div className="space-y-1.5">
              {top3.map((entry) => {
                const rankStyle = getRankStyle(entry.rank);
                const isCurrentUser = entry.userId === userId;
                
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md ${isCurrentUser ? 'bg-green-50/60' : ''}`}
                  >
                    <div 
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: rankStyle.bg }}
                    >
                      {entry.rank <= 3 ? (
                        <Medal className="w-2.5 h-2.5" style={{ color: rankStyle.color }} />
                      ) : (
                        <span className="text-[9px] font-bold" style={{ color: rankStyle.color }}>
                          {entry.rank}
                        </span>
                      )}
                    </div>
                    <SquircleAvatar
                      size={18}
                      src={entry.avatarUrl || undefined}
                      alt={entry.displayName}
                      fallback={entry.displayName.charAt(0).toUpperCase()}
                    />
                    <span className="text-[11px] font-medium text-slate-700 flex-1 truncate">
                      {isCurrentUser ? 'You' : entry.displayName.split(' ')[0]}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5 text-amber-500" />
                      <span className="text-[10px] font-bold text-slate-600">{entry.totalPlayed}</span>
                    </div>
                  </div>
                );
              })}
              
              {userId && userRank && (
                <div className="pt-1.5 border-t border-slate-100 mt-1.5">
                  <p className="text-[10px] text-center text-slate-500">
                    {isUserInTop10 ? (
                      <span className="text-green-600 font-medium">🎉 #{userRank}</span>
                    ) : (
                      <>Your rank: <span className="font-semibold">#{userRank}</span></>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              No entries yet
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MergedStatsCard;
