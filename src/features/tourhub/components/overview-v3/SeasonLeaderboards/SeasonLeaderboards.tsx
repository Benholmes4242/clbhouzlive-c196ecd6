// src/features/tourhub/components/overview-v3/SeasonLeaderboards/SeasonLeaderboards.tsx

import { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonLeaderboards, CATEGORY_CONFIG as CATEGORY_DATA_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { CategoryTabs } from './CategoryTabs';
import { PodiumSection } from './PodiumSection';
import { LeaderboardList } from './LeaderboardList';
import { SeasonToggle } from './SeasonToggle';
import { CATEGORY_CONFIG } from './constants';
import type { CategoryId } from './types';

// Skeleton loader
const SeasonLeaderboardsSkeleton = memo(function SeasonLeaderboardsSkeleton() {
  return (
    <section className="px-4 py-6">
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-full bg-gray-100 rounded-full animate-pulse" />
      </div>
      
      {/* Skeleton tabs */}
      <div className="flex gap-2 mt-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
      
      {/* Skeleton cards */}
      <div className="mt-6 space-y-4">
        <div className="aspect-[4/5] bg-gray-200 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-[3/4] bg-gray-200 rounded-3xl animate-pulse" />
          <div className="aspect-[3/4] bg-gray-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    </section>
  );
});

// Empty state
const SeasonLeaderboardsEmpty = memo(function SeasonLeaderboardsEmpty() {
  return (
    <section className="px-4 py-6">
      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📊</span>
          <h3 className="font-semibold text-gray-900">No Stats Available</h3>
          <p className="text-sm text-gray-500">
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
    <section className="px-4 py-6">
      {/* Section Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <img
              src="/pga-tour-logo.png"
              alt="PGA Tour"
              className="h-5 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              • {data.year} Season
            </span>
          </div>
          
          {/* Season Toggle */}
          <SeasonToggle
            availableSeasons={data.availableSeasons}
            selectedYear={selectedYear ?? data.year}
            onYearChange={setSelectedYear}
          />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Season Leaderboards</h2>
        <p className="text-sm text-gray-500 mt-1">
          Who dominated each statistical category?
        </p>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={CATEGORY_CONFIG}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Category Description Card */}
      <div className="mt-4 mb-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeCategoryData?.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{activeCategoryData?.name}</h3>
                <p className="text-xs text-gray-500">{activeCategoryData?.description}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Podium Section - Top 3 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeCategory}-${selectedYear}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PodiumSection players={topThree} />
        </motion.div>
      </AnimatePresence>

      {/* Stats Insight Card */}
      {activeCategoryData && activeCategoryData.topTenAverage > 0 && (
        <div className="mt-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <p className="text-sm text-blue-900">
                The top 10 averaged{' '}
                <span className="font-bold">
                  {formatAverage(activeCategoryData.topTenAverage, activeCategory)}{' '}
                  {activeCategoryData.players[0]?.statUnit}
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Leaderboard List - Positions 4-10 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`list-${activeCategory}-${selectedYear}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="mt-5"
        >
          <LeaderboardList players={restOfList} />
        </motion.div>
      </AnimatePresence>

      {/* View All Button */}
      <div className="mt-5">
        <button
          onClick={() => {
            window.location.href = '/tourhub/stats';
          }}
          className="w-full py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-2xl border border-gray-200 transition-colors duration-200"
        >
          <div className="flex items-center justify-center gap-2">
            <span>{activeCategoryData?.icon}</span>
            <span className="font-medium text-gray-700">
              View All {activeCategoryData?.name} Stats
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
