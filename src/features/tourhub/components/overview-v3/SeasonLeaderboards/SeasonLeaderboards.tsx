/**
 * SeasonLeaderboards - Statistical Category Leaders (Apple-grade redesign)
 * 
 * Features:
 * - Compact horizontal podium layout (2nd-1st-3rd)
 * - Redesigned category pills (lighter, branded)
 * - Consistent list styling (matches World Rankings)
 * - Top 10 summary banner with branded green
 * - View All button with category icon
 * - Display exactly 10 players (3 podium + 7 list)
 * - Podium entry animation on category change
 * - Shimmer skeleton loading
 */

import { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonLeaderboards, CATEGORY_CONFIG as CATEGORY_DATA_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { CategoryTabs } from './CategoryTabs';
import { PodiumSection } from './PodiumSection';
import { LeaderboardList } from './LeaderboardList';
import { SeasonToggle } from './SeasonToggle';
import { CATEGORY_CONFIG } from './constants';
import type { CategoryId } from './types';

// Shimmer skeleton loader
const SeasonLeaderboardsSkeleton = memo(function SeasonLeaderboardsSkeleton() {
  return (
    <section className="px-4 pt-6 pb-4">
      {/* Header skeleton */}
      <div className="space-y-1 mb-4">
        <div className="h-3 w-20 rounded overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
        <div className="h-6 w-44 rounded overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
      </div>
      
      {/* Category pills skeleton */}
      <div className="flex gap-2 overflow-hidden mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="h-10 w-24 rounded-full flex-shrink-0 overflow-hidden relative"
          >
            <div 
              className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
              style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
            />
          </div>
        ))}
      </div>
      
      {/* Podium skeleton - horizontal */}
      <div className="flex items-end justify-center gap-2 py-5">
        {/* 2nd place */}
        <div className="w-[100px] h-[140px] rounded-2xl overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
        {/* 1st place */}
        <div className="w-[120px] h-[160px] rounded-2xl overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
        {/* 3rd place */}
        <div className="w-[100px] h-[140px] rounded-2xl overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
      </div>
      
      {/* List skeleton - 7 rows */}
      <div className="mt-4">
        {[...Array(7)].map((_, i) => (
          <div 
            key={i}
            className="flex items-center gap-3 py-3.5 border-b border-black/[0.04]"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden relative">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
              />
            </div>
            <div className="w-11 h-11 rounded-full overflow-hidden relative">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
              />
            </div>
            <div className="flex-1">
              <div className="h-4 w-24 rounded overflow-hidden relative mb-1">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                  style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
                />
              </div>
              <div className="h-3 w-16 rounded overflow-hidden relative">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                  style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
                />
              </div>
            </div>
            <div className="h-5 w-14 rounded overflow-hidden relative">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
});

// Empty state
const SeasonLeaderboardsEmpty = memo(function SeasonLeaderboardsEmpty() {
  return (
    <section className="px-4 pt-6 pb-4">
      <div className="bg-slate-50 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📊</span>
          <h3 className="font-semibold text-slate-900">No Stats Available</h3>
          <p className="text-sm text-slate-500">
            Season statistics will appear here once available.
          </p>
        </div>
      </div>
    </section>
  );
});

export function SeasonLeaderboards() {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('distance');
  
  const { data, isLoading, error } = useSeasonLeaderboards(selectedYear);

  // Set initial year once data loads (defaults to newest)
  useEffect(() => {
    if (data && selectedYear === undefined) {
      setSelectedYear(data.year);
    }
  }, [data, selectedYear]);

  // Loading state
  if (isLoading) {
    return <SeasonLeaderboardsSkeleton />;
  }

  // Error or no data state
  if (error || !data?.categories?.length) {
    return <SeasonLeaderboardsEmpty />;
  }

  const activeCategoryData = data.categories.find((c) => c.id === activeCategory);
  const topThree = activeCategoryData?.players.slice(0, 3) || [];
  const restOfList = activeCategoryData?.players.slice(3, 10) || [];

  // Format the top 10 average for display
  const formatAverage = (avg: number, categoryId: CategoryId) => {
    const config = CATEGORY_DATA_CONFIG[categoryId];
    if (!config) return avg.toFixed(1);
    return config.formatValue(avg);
  };

  return (
    <section className="px-4 pt-6 pb-4">
      {/* Section Header - refined typography */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
            {data.year} Season
          </p>
          
          {/* Season Toggle */}
          <SeasonToggle
            availableSeasons={data.availableSeasons}
            selectedYear={selectedYear ?? data.year}
            onYearChange={setSelectedYear}
          />
        </div>
        <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
          Season Leaderboards
        </h2>
        {/* Subtitle removed as per spec */}
      </div>

      {/* Category Tabs - redesigned */}
      <CategoryTabs
        categories={CATEGORY_CONFIG}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Podium Section - Horizontal layout with animation */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${selectedYear}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PodiumSection players={topThree} categoryId={activeCategory} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top 10 Summary Banner - branded green */}
      {activeCategoryData && activeCategoryData.topTenAverage > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 px-4 py-3 mt-4 bg-[#2D7A3A] rounded-xl"
        >
          <span className="text-base">🌍</span>
          <p className="text-sm text-white">
            Top 10 average:{' '}
            <span className="font-bold">
              {formatAverage(activeCategoryData.topTenAverage, activeCategory)}{' '}
              {activeCategoryData.players[0]?.statUnit}
            </span>
          </p>
        </motion.div>
      )}

      {/* Leaderboard List - Positions 4-10 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`list-${activeCategory}-${selectedYear}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="mt-4"
        >
          <LeaderboardList players={restOfList} />
        </motion.div>
      </AnimatePresence>

      {/* View All Button */}
      <div className="mt-4">
        <button
          onClick={() => {
            window.location.href = '/tourhub/stats';
          }}
          className="w-full py-3.5 bg-black/[0.03] hover:bg-black/[0.06] active:bg-black/[0.08] rounded-xl border border-black/[0.06] transition-all duration-150"
        >
          <div className="flex items-center justify-center gap-2">
            <span>{activeCategoryData?.icon}</span>
            <span className="font-medium text-[15px] text-[#1a1a1a]">
              View All {activeCategoryData?.name} Stats
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
