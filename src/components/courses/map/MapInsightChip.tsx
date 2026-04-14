/**
 * MapInsightChip - Floating insight chip for Top 100 Map
 * Shows dynamic insights based on filters/region
 * Hides during map interaction, shows after 1-2s idle
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import '@/styles/hero-glass.css';
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
  /** Whether the user has a private profile (hides social insights) */
  isPrivateProfile?: boolean;
  /** Number of friends on the platform (0 = hide social) */
  friendsCount?: number;
  /** Whether the map failed to load */
  isMapError?: boolean;
}

type InsightCategory = 'progress' | 'region' | 'status' | 'motivational' | 'social' | 'empty';

interface Insight {
  id: string;
  text: string;
  category: InsightCategory;
}

// Idle rotation interval range (20-30 seconds)
const MIN_IDLE_MS = 20000;
const MAX_IDLE_MS = 30000;

export const MapInsightChip: React.FC<MapInsightChipProps> = ({
  courses,
  playedCount,
  totalCount,
  scope,
  ratedFilter,
  isPrivateProfile = false,
  friendsCount = 0,
  isMapError = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const idleTimerRef = useRef<number | null>(null);

  // Get random idle interval
  const getRandomIdleInterval = useCallback(() => {
    return Math.floor(Math.random() * (MAX_IDLE_MS - MIN_IDLE_MS + 1)) + MIN_IDLE_MS;
  }, []);

  // Rotate to next insight
  const rotateInsight = useCallback(() => {
    setCurrentInsightIndex((prev) => prev + 1);
  }, []);

  // Reset and restart idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(rotateInsight, getRandomIdleInterval());
  }, [rotateInsight, getRandomIdleInterval]);

  // Reset dismissed state and rotate when filters change
  useEffect(() => {
    setIsDismissed(false);
    setCurrentInsightIndex((prev) => prev + 1);
    resetIdleTimer();
  }, [scope, ratedFilter, resetIdleTimer]);

  // Start idle timer on mount
  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Generate insights based on current data and context
  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];
    const remaining = totalCount - playedCount;
    const percentage = totalCount > 0 ? Math.round((playedCount / totalCount) * 100) : 0;

    // Count courses by country
    const playedCourses = courses.filter((c) => c.user_has_rated);
    const countryCount: Record<string, number> = {};
    let regionsExplored = new Set<string>();
    
    playedCourses.forEach((c) => {
      if (c.country) {
        countryCount[c.country] = (countryCount[c.country] || 0) + 1;
        regionsExplored.add(c.country);
      }
    });

    const sortedCountries = Object.entries(countryCount)
      .sort(([, a], [, b]) => b - a);

    const topCountry = sortedCountries[0]?.[0];

    // ===== EDGE CASE: No played courses =====
    if (playedCount === 0) {
      result.push(
        { id: 'empty-1', text: 'Everyone starts with the first course.', category: 'empty' },
        { id: 'empty-2', text: 'Your first Top 100 course awaits.', category: 'empty' },
        { id: 'empty-3', text: 'Your journey is just beginning.', category: 'empty' }
      );
      return result;
    }

    // ===== PROGRESS-BASED INSIGHTS =====
    const nextMilestones = [5, 10, 20, 50, 100, 200, 300, 400];
    const nextMilestone = nextMilestones.find((m) => m > playedCount);
    
    if (nextMilestone) {
      const toNext = nextMilestone - playedCount;
      if (toNext <= 5 && toNext > 0) {
        result.push({
          id: 'progress-close',
          text: `You're just ${toNext} course${toNext !== 1 ? 's' : ''} away from your next milestone.`,
          category: 'progress',
        });
      }
      if (nextMilestone === 50 && toNext <= 24) {
        result.push({
          id: 'progress-50club',
          text: `Only ${toNext} courses until the 50 Club.`,
          category: 'progress',
        });
      }
    }

    if (percentage >= 25 && percentage < 30) {
      result.push({
        id: 'progress-quarter',
        text: `Quarter-way there — ${percentage}% complete.`,
        category: 'progress',
      });
    }

    if (playedCount >= 5) {
      result.push({
        id: 'progress-momentum',
        text: `Momentum check: ${playedCount} courses played in your journey.`,
        category: 'progress',
      });
    }

    if (playedCount >= 1) {
      result.push({
        id: 'progress-underway',
        text: "Your Top 100 journey is officially underway.",
        category: 'progress',
      });
    }

    result.push({
      id: 'progress-every',
      text: "Every course counts — you're building something special.",
      category: 'progress',
    });

    // ===== REGION-BASED INSIGHTS =====
    if (topCountry === 'Scotland' && countryCount['Scotland'] >= 2) {
      result.push({
        id: 'region-scotland',
        text: 'Scotland leads your journey so far.',
        category: 'region',
      });
    }

    if (scope === 'gb-i' && !countryCount['England']) {
      result.push({
        id: 'region-england',
        text: 'England is calling — several classics still to play.',
        category: 'region',
      });
    }

    if (scope === 'gb-i' && !countryCount['Ireland'] && !countryCount['Northern Ireland']) {
      result.push({
        id: 'region-ireland',
        text: 'Ireland remains your biggest opportunity.',
        category: 'region',
      });
    }

    if (scope === 'europe' && playedCount < totalCount / 2) {
      result.push({
        id: 'region-europe',
        text: 'Europe could be your fastest progress gain.',
        category: 'region',
      });
    }

    if (scope === 'usa' && playedCount < totalCount / 2) {
      result.push({
        id: 'region-usa',
        text: 'USA courses are still wide open for you.',
        category: 'region',
      });
    }

    if (regionsExplored.size >= 3) {
      result.push({
        id: 'region-explored',
        text: `You've explored ${regionsExplored.size} regions so far.`,
        category: 'region',
      });
    }

    // ===== STATUS-BASED INSIGHTS =====
    if (scope === 'global') {
      result.push({
        id: 'status-worldwide',
        text: `You've claimed ${playedCount} courses worldwide.`,
        category: 'status',
      });
    }

    if (remaining > playedCount) {
      result.push({
        id: 'status-unplayed',
        text: 'Unplayed courses outnumber played — for now.',
        category: 'status',
      });
    }

    result.push({
      id: 'status-map-story',
      text: 'Your map tells a story. Keep writing it.',
      category: 'status',
    });

    // ===== MOTIVATIONAL / ASPIRATIONAL =====
    result.push(
      { id: 'motivational-1', text: 'Every dot here is a memory.', category: 'motivational' },
      { id: 'motivational-2', text: 'This map is becoming your legacy.', category: 'motivational' },
      { id: 'motivational-3', text: "Great journeys aren't rushed.", category: 'motivational' },
      { id: 'motivational-4', text: "You're not collecting courses — you're earning them.", category: 'motivational' },
      { id: 'motivational-5', text: 'Imagine this map at 100%.', category: 'motivational' },
      { id: 'motivational-6', text: 'Some journeys are meant to be finished.', category: 'motivational' }
    );

    // ===== SOCIAL INSIGHTS (only if not private and has friends) =====
    if (!isPrivateProfile && friendsCount > 0) {
      if (friendsCount >= 2) {
        result.push({
          id: 'social-ahead',
          text: `You're ahead of ${Math.min(friendsCount, 2)} friends on this journey.`,
          category: 'social',
        });
      }
      result.push(
        { id: 'social-leading', text: "You're leading your circle globally.", category: 'social' },
        { id: 'social-closing', text: 'One friend is closing the gap.', category: 'social' }
      );
    } else if (!isPrivateProfile && friendsCount === 0) {
      // No friends on platform
      result.push(
        { id: 'social-benchmark', text: "You're setting the benchmark.", category: 'social' },
        { id: 'social-invite', text: 'Invite friends to compare journeys.', category: 'social' }
      );
    }

    return result;
  }, [courses, playedCount, totalCount, scope, isPrivateProfile, friendsCount]);

  // Get current insight with wrap-around
  const currentInsight = insights.length > 0 
    ? insights[currentInsightIndex % insights.length] 
    : null;

  // Don't render if dismissed, no insight, or map error
  if (isDismissed || !currentInsight) return null;

  // Map error fallback message
  if (isMapError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex"
      >
        <div className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-full">
          <span className="text-[11px] text-white/90 leading-tight">Map unavailable — your journey progress is still safe.</span>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentInsight.id}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="inline-flex"
      >
        <div className="glass-card flex items-center gap-2 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#F7931E' }} />
          
          <span className="text-[11px] text-white/90 leading-tight font-medium">{currentInsight.text}</span>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 p-1 -mr-1 text-white/40 hover:text-white/80 transition-colors rounded-full hover:bg-white/10"
            aria-label="Dismiss insight"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapInsightChip;
