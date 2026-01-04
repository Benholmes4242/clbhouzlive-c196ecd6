/**
 * GolfJourneyProgress - Phase 6: Personal Progress (calm, no comparison)
 * Shows courses played, regions, Top 100 progress with smooth animations
 */
import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface GolfJourneyProgressProps {
  userId: string | undefined;
  isOwnProfile?: boolean;
  className?: string;
}

interface JourneyStats {
  totalCoursesPlayed: number;
  regionsPlayed: { name: string; code: string; count: number }[];
  top100Progress: { listName: string; played: number; total: number }[];
}

// Animation variants with proper easing types
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const } }
};

// Animated number component
const AnimatedStat: React.FC<{ 
  value: number | null; 
  isLoading: boolean;
  minCh?: number;
  className?: string;
}> = ({ value, isLoading, minCh = 3, className = '' }) => {
  const display = isLoading ? '—' : String(value ?? 0);
  
  return (
    <motion.span
      className={`tabular-nums inline-block ${className}`}
      style={{ minWidth: `${minCh}ch` }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      key={display}
    >
      {display}
    </motion.span>
  );
};

// Animated progress bar that only animates once on first load
const AnimatedProgressBar: React.FC<{
  percentage: number;
  isLoading: boolean;
}> = ({ percentage, isLoading }) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isLoading, hasLoaded]);
  
  return (
    <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-slate-500/80 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: hasLoaded ? `${percentage}%` : 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </div>
  );
};

export const GolfJourneyProgress: React.FC<GolfJourneyProgressProps> = ({
  userId,
  isOwnProfile = false,
  className,
}) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['golf-journey-progress', userId],
    enabled: !!userId,
    queryFn: async (): Promise<JourneyStats> => {
      if (!userId) return { totalCoursesPlayed: 0, regionsPlayed: [], top100Progress: [] };

      // Get user's rated courses (played)
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select('course_id, golf_courses!inner(country, region, continent)')
        .eq('user_id', userId)
        .eq('is_mock', false);

      const totalCoursesPlayed = ratings?.length || 0;

      // Calculate regions played
      const regionMap = new Map<string, { name: string; code: string; count: number }>();
      ratings?.forEach((r: any) => {
        const country = r.golf_courses?.country || 'Unknown';
        if (!regionMap.has(country)) {
          regionMap.set(country, { name: country, code: country, count: 0 });
        }
        regionMap.get(country)!.count++;
      });

      const regionsPlayed = Array.from(regionMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get Top 100 progress
      const { data: memberships } = await supabase
        .from('course_top100_memberships')
        .select('course_id, list:top100_lists!inner(id, slug, name)');

      const listProgress = new Map<string, { listName: string; played: number; total: number }>();

      memberships?.forEach((m: any) => {
        const listName = m.list?.name || 'Unknown';
        const listSlug = m.list?.slug || '';
        
        if (!listProgress.has(listSlug)) {
          listProgress.set(listSlug, { listName, played: 0, total: 0 });
        }
        listProgress.get(listSlug)!.total++;
        
        // Check if user has played this course
        if (ratings?.some((r: any) => r.course_id === m.course_id)) {
          listProgress.get(listSlug)!.played++;
        }
      });

      return {
        totalCoursesPlayed,
        regionsPlayed,
        top100Progress: Array.from(listProgress.values())
          .filter(p => p.total > 0)
          .sort((a, b) => b.played - a.played),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Keep layout stable while loading - render structure immediately
  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-xl p-5 space-y-5", className)}>
        {/* Header - always visible */}
        <h3 className="text-base font-semibold text-slate-900">
          {isOwnProfile ? 'Your Golf Journey' : 'Golf Journey'}
        </h3>
        
        {/* Courses placeholder - stable layout */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Flag className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums min-w-[3ch]">—</p>
            <p className="text-sm text-slate-500">courses played</p>
          </div>
        </div>
        
        {/* Countries placeholder */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Countries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalCoursesPlayed === 0) {
    return (
      <div className={cn("bg-white rounded-xl p-4", className)}>
        <h3 className="text-base font-semibold text-slate-900 mb-1.5">
          {isOwnProfile ? 'Your Golf Journey' : 'Golf Journey'}
        </h3>
        <p className="text-sm text-slate-500">
          {isOwnProfile 
            ? "Rate courses you've played to build your journey."
            : "No courses played yet."}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className={cn("bg-white rounded-xl p-5 space-y-5", className)}
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.h3 
        className="text-base font-semibold text-slate-900"
        variants={itemVariants}
      >
        {isOwnProfile ? 'Your Golf Journey' : 'Golf Journey'}
      </motion.h3>

      {/* Total courses - with animated number */}
      <motion.div className="flex items-center gap-3" variants={itemVariants}>
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <Flag className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <AnimatedStat 
            value={stats.totalCoursesPlayed} 
            isLoading={false}
            minCh={2}
            className="text-2xl font-semibold text-slate-900"
          />
          <p className="text-sm text-slate-500">courses played</p>
        </div>
      </motion.div>

      {/* Countries/Regions played - with staggered pills */}
      {stats.regionsPlayed.length > 0 && (
        <motion.div className="pt-4 border-t border-slate-100" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Countries</span>
          </div>
          <motion.div 
            className="flex flex-wrap gap-1.5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {stats.regionsPlayed.map((region, index) => (
              <motion.span
                key={region.code}
                className="inline-flex items-center px-2.5 py-1 text-sm bg-slate-50 text-slate-700 rounded-full border border-slate-100"
                variants={itemVariants}
              >
                {region.name}
                <AnimatedStat 
                  value={region.count} 
                  isLoading={false}
                  minCh={1}
                  className="ml-1.5 text-xs text-slate-500 font-medium"
                />
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Top 100 progress with animated bars */}
      {stats.top100Progress.length > 0 && stats.top100Progress.some(p => p.played > 0) && (
        <motion.div className="pt-4 border-t border-slate-100" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Top 100 Progress</span>
          </div>
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {stats.top100Progress
              .filter(p => p.played > 0)
              .slice(0, 4)
              .map((progress) => {
                const percentage = (progress.played / progress.total) * 100;
                return (
                  <motion.div key={progress.listName} variants={itemVariants}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600">{progress.listName}</span>
                      <motion.span 
                        className="text-sm font-medium text-slate-900 tabular-nums min-w-[7ch] text-right"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
                      >
                        {progress.played} <span className="text-slate-400">/ {progress.total}</span>
                      </motion.span>
                    </div>
                    <AnimatedProgressBar 
                      percentage={percentage} 
                      isLoading={false}
                    />
                  </motion.div>
                );
              })}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GolfJourneyProgress;
