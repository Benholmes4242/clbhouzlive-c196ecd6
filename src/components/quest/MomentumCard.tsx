/**
 * MomentumCard - Weekly momentum display
 * Shows last course logged date and courses logged this month
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Flame } from 'lucide-react';

interface MomentumCardProps {
  recentlyPlayed: {
    id: string;
    name: string;
    dateAdded?: string;
  }[];
}

export const MomentumCard: React.FC<MomentumCardProps> = ({
  recentlyPlayed,
}) => {
  // Calculate last course date and this month count
  const { lastCourseDate, thisMonthCount, hasActivity } = useMemo(() => {
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
      return { lastCourseDate: null, thisMonthCount: 0, hasActivity: false };
    }

    // Parse dates - dateAdded is in format "DD MMM" like "15 Jan"
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Find the most recent date
    let latestDate: Date | null = null;
    let monthCount = 0;

    for (const course of recentlyPlayed) {
      if (!course.dateAdded) continue;
      
      // Parse "DD MMM" format
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
      
      // Assume current year, but if month is in future, use last year
      let year = currentYear;
      if (month > currentMonth) {
        year = currentYear - 1;
      }
      
      const courseDate = new Date(year, month, day);
      
      // Track latest
      if (!latestDate || courseDate > latestDate) {
        latestDate = courseDate;
      }
      
      // Count this month
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

  // Format the last course date
  const formatLastDate = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <section>
      {/* Section header */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">Momentum</h2>
      
      {/* Icon + stat rows */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {hasActivity ? (
          <div className="space-y-3">
            {/* Last course logged */}
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(110, 146, 119, 0.1)',
                  border: '1px solid rgba(110, 146, 119, 0.2)',
                }}
              >
                <Calendar className="w-4 h-4" style={{ color: 'var(--quest-accent-green)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Last course logged
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatLastDate(lastCourseDate)}
                </p>
              </div>
            </div>

            {/* This month count */}
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(210, 180, 97, 0.1)',
                  border: '1px solid rgba(210, 180, 97, 0.2)',
                }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--quest-accent-gold)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Courses logged this month
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {thisMonthCount}
                </p>
              </div>
            </div>

            {/* Encouragement copy */}
            <p className="text-xs mt-2 text-muted-foreground">
              Keep building your journey.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--quest-chip-bg)',
                border: '1px solid var(--quest-stroke)',
              }}
            >
              <Flame className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Log your first Top 100 course to start momentum.
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default MomentumCard;