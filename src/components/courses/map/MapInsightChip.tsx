/**
 * MapInsightChip - Floating insight chip for Top 100 Map
 * Shows dynamic insights based on filters/region
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Top100MapScope, Top100MapCourse } from '@/hooks/useTop100MapCourses';

interface MapInsightChipProps {
  courses: Top100MapCourse[];
  playedCount: number;
  totalCount: number;
  scope: Top100MapScope;
  ratedFilter: 'all' | 'rated' | 'unrated';
}

interface Insight {
  id: string;
  text: string;
  type: 'milestone' | 'region' | 'general';
}

export const MapInsightChip: React.FC<MapInsightChipProps> = ({
  courses,
  playedCount,
  totalCount,
  scope,
  ratedFilter,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  // Reset dismissed state when filters change
  useEffect(() => {
    setIsDismissed(false);
    setCurrentInsightIndex(0);
  }, [scope, ratedFilter]);

  // Generate insights based on current data
  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];
    const remaining = totalCount - playedCount;

    // Milestone proximity insights
    const nextMilestones = [5, 10, 20, 50, 100, 200, 300, 400];
    const nextMilestone = nextMilestones.find((m) => m > playedCount);
    if (nextMilestone) {
      const toNext = nextMilestone - playedCount;
      if (toNext <= 5 && toNext > 0) {
        result.push({
          id: 'milestone-close',
          text: `You're ${toNext} course${toNext !== 1 ? 's' : ''} away from your next milestone.`,
          type: 'milestone',
        });
      } else if (toNext <= 10) {
        result.push({
          id: 'milestone-near',
          text: `Just ${toNext} more to reach the ${nextMilestone} Club!`,
          type: 'milestone',
        });
      }
    }

    // Region-specific insights
    const getRegionLabel = (s: Top100MapScope): string => {
      const labels: Record<Top100MapScope, string> = {
        global: 'globally',
        'gb-i': 'in Britain & Ireland',
        usa: 'in the USA',
        europe: 'in Continental Europe',
      };
      return labels[s];
    };

    // Count courses by country
    const playedCourses = courses.filter((c) => c.user_has_rated);
    const countryCount: Record<string, number> = {};
    playedCourses.forEach((c) => {
      if (c.country) {
        countryCount[c.country] = (countryCount[c.country] || 0) + 1;
      }
    });

    const sortedCountries = Object.entries(countryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (sortedCountries.length > 0) {
      const [topCountry, topCount] = sortedCountries[0];
      if (topCount >= 3) {
        result.push({
          id: 'top-country',
          text: `${topCountry} is your strongest region with ${topCount} courses played.`,
          type: 'region',
        });
      }
    }

    // General progress insights
    if (playedCount > 0 && remaining > 0) {
      const percentage = Math.round((playedCount / totalCount) * 100);
      
      if (percentage >= 50) {
        result.push({
          id: 'halfway',
          text: `You've conquered over half the Top 100 ${getRegionLabel(scope)}!`,
          type: 'general',
        });
      } else if (percentage >= 25) {
        result.push({
          id: 'quarter',
          text: `A quarter of the way through ${getRegionLabel(scope)}. Keep going!`,
          type: 'general',
        });
      }
    }

    // Filter-specific insights
    if (ratedFilter === 'unrated' && remaining > 0) {
      result.push({
        id: 'unrated-remaining',
        text: `${remaining} legendary courses still await your visit.`,
        type: 'general',
      });
    }

    // Fallback insight
    if (result.length === 0) {
      result.push({
        id: 'explore',
        text: `Explore ${totalCount} world-class courses ${getRegionLabel(scope)}.`,
        type: 'general',
      });
    }

    return result;
  }, [courses, playedCount, totalCount, scope, ratedFilter]);

  const currentInsight = insights[currentInsightIndex % insights.length];

  if (isDismissed || !currentInsight) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 z-20',
          'max-w-[85%]'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            'px-3 py-2 rounded-sq-pill',
            'bg-slate-900/90 dark:bg-white/95',
            'backdrop-blur-xl',
            'shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
            'text-xs text-white dark:text-slate-900'
          )}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400 dark:text-amber-500 flex-shrink-0" />
          
          <span className="leading-tight">{currentInsight.text}</span>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 p-0.5 -mr-1 text-white/60 dark:text-slate-500 hover:text-white dark:hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapInsightChip;
