import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardInsightChipProps {
  userRank?: number;
  totalPlayed?: number;
  friendsCount?: number;
  variant?: 'players' | 'courses';
}

// Progress & Momentum insights
const PROGRESS_INSIGHTS = [
  "You're ahead of 92% of players on this list.",
  'Your pace puts you on track for Heritage Club this year.',
  "You've added more Top 100 courses than most players nearby.",
  'Momentum check: steady progress over the last 30 days.',
  "You're gaining ground faster than your local average.",
  'Consistent play is keeping you near the top.',
];

// Competitive Context insights
const COMPETITIVE_INSIGHTS = [
  'Only 3 players within 5 courses of your position.',
  'The gap behind you is widening.',
  'The next jump takes fewer courses than the last one.',
  "You're competing in a tight cluster right now.",
  'One strong run could change this leaderboard quickly.',
  'This part of the table moves fast.',
];

// Friends / Social insights
const SOCIAL_INSIGHTS = [
  "You're leading your friends on this list.",
  'Your circle is closing the gap.',
  "You've played more Top 100 courses than most of your circle.",
  'Friends are most active on GB&I courses right now.',
  'Your group tends to favour classic links tracks.',
];

// Courses leaderboard insights
const COURSES_INSIGHTS = [
  'This course is popular among high-ranked players.',
  'Highly rated, but not widely played yet.',
  'This course appears frequently in Top 10 lists.',
  'Friends tend to rate this course higher than average.',
  'Courses like this often boost leaderboard movement.',
];

// Long-term framing
const LONGTERM_INSIGHTS = [
  'Players who reach Century Club average 3–5 courses a year.',
  'Consistency beats bursts at the top of this leaderboard.',
  'Most top players build their position over years, not months.',
  'This leaderboard rewards depth, not speed.',
];

export function LeaderboardInsightChip({ 
  userRank = 50, 
  totalPlayed = 0, 
  friendsCount = 0,
  variant = 'players' 
}: LeaderboardInsightChipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build contextual insight pool
  const insightPool = useMemo(() => {
    const pool: string[] = [];
    
    if (variant === 'courses') {
      pool.push(...COURSES_INSIGHTS);
    } else {
      // Add progress insights for active players
      if (totalPlayed > 0) {
        pool.push(...PROGRESS_INSIGHTS.slice(0, 3));
      }
      
      // Add competitive insights for ranked players
      if (userRank > 0 && userRank <= 100) {
        pool.push(...COMPETITIVE_INSIGHTS.slice(0, 3));
      }
      
      // Add social insights if user has friends
      if (friendsCount > 0) {
        pool.push(...SOCIAL_INSIGHTS.slice(0, 2));
      }
      
      // Always include some long-term framing
      pool.push(...LONGTERM_INSIGHTS.slice(0, 2));
    }
    
    // Fallback if pool is empty
    if (pool.length === 0) {
      pool.push('This leaderboard rewards depth, not speed.');
    }
    
    return pool;
  }, [variant, userRank, totalPlayed, friendsCount]);

  // Rotate insight every 10 seconds
  useEffect(() => {
    if (insightPool.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % insightPool.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [insightPool.length]);

  // Reset index when pool changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [variant]);

  const currentInsight = insightPool[currentIndex % insightPool.length];

  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-sq-sm bg-primary/5 border border-primary/10">
      <Lightbulb className="w-3.5 h-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/80 leading-relaxed">
        {currentInsight}
      </p>
    </div>
  );
}
