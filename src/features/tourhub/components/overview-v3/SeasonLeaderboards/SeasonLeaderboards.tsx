/**
 * SeasonLeaderboards - Complete Redesign (Apple-grade polish)
 * 
 * Features:
 * - Compact horizontal podium layout (2nd-1st-3rd)
 * - Refined category pills with branded green selection
 * - Consistent list styling matching World Rankings
 * - Top 10 summary banner
 * - Skeleton loading with shimmer
 * - Display exactly 10 players (3 podium + 7 list)
 */

import { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSeasonLeaderboards, CATEGORY_CONFIG as CATEGORY_DATA_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { CategoryTabs } from './CategoryTabs';
import { PodiumSection } from './PodiumSection';
import { LeaderboardList } from './LeaderboardList';
import { SeasonToggle } from './SeasonToggle';
import { CATEGORY_CONFIG } from './constants';
import type { CategoryId } from './types';

/** Skeleton loader with shimmer */
const SeasonLeaderboardsSkeleton = memo(function SeasonLeaderboardsSkeleton() {
  return (
    <section className="pt-6 pb-4 border-t border-slate-100">
      {/* Header */}
      <div className="px-4 mb-4">
        <div 
          className="h-3 w-24 rounded mb-2"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
        <div 
          className="h-7 w-48 rounded"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      </div>
      
      {/* Category tabs skeleton */}
      <div className="flex gap-2 px-4 mb-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="h-10 w-24 rounded-full flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
        ))}
      </div>
      
      {/* Podium skeleton - horizontal layout */}
      <div className="flex items-end justify-center gap-2 px-4 py-5">
        {/* 2nd place */}
        <div 
          className="w-[100px] h-[140px] rounded-2xl"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
        {/* 1st place */}
        <div 
          className="w-[120px] h-[160px] rounded-2xl"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
        {/* 3rd place */}
        <div 
          className="w-[100px] h-[140px] rounded-2xl"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      </div>
      
      {/* List skeleton - 7 rows */}
      <div className="mt-4">
        {[4, 5, 6, 7, 8, 9, 10].map((i, idx) => (
          <div 
            key={i} 
            className="flex items-center gap-3 px-4 py-3.5 h-[72px]"
            style={{ backgroundColor: idx % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent' }}
          >
            <div 
              className="w-8 h-5 rounded"
              style={{
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
              }}
            />
            <div 
              className="w-11 h-11 rounded-full flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
              }}
            />
            <div className="flex-1 space-y-1.5">
              <div 
                className="h-4 w-28 rounded"
                style={{
                  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite linear',
                }}
              />
              <div 
                className="h-3 w-20 rounded"
                style={{
                  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite linear',
                }}
              />
            </div>
            <div 
              className="h-5 w-16 rounded"
              style={{
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

// Empty state
const SeasonLeaderboardsEmpty = memo(function SeasonLeaderboardsEmpty() {
  return (
    <section className="pt-6 pb-4 border-t border-slate-100">
      <div className="px-4">
        <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
          2025 Season
        </p>
        <h2 className="text-[22px] font-semibold text-slate-900 mt-1">Season Leaderboards</h2>
      </div>
      <div className="bg-slate-50 rounded-2xl p-8 text-center mx-4 mt-4">
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
  const navigate = useNavigate();
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
    <section className="pt-6 pb-4 border-t border-slate-100">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
              {data.year} Season
            </p>
            {/* Season Toggle - inline */}
            <SeasonToggle
              availableSeasons={data.availableSeasons}
              selectedYear={selectedYear ?? data.year}
              onYearChange={setSelectedYear}
            />
          </div>
          <h2 className="text-[22px] font-semibold text-slate-900 mt-1">Season Leaderboards</h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub/stats')}
          className="text-[15px] font-medium text-slate-400 flex items-center gap-0.5 hover:text-slate-600 transition-colors"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={CATEGORY_CONFIG}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Category Description - Simplified */}
      <div className="px-4 mt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 py-3"
          >
            <span className="text-2xl">{activeCategoryData?.icon}</span>
            <div>
              <h3 className="font-semibold text-slate-900 text-[15px]">{activeCategoryData?.name}</h3>
              <p className="text-[13px] text-slate-500/80">{activeCategoryData?.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Podium Section - Compact Horizontal Layout */}
      <div className="mt-4 px-4">
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

      {/* Top 10 Summary Banner */}
      {activeCategoryData && activeCategoryData.topTenAverage > 0 && (
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl"
            style={{
              background: 'rgba(45, 122, 58, 0.04)',
              border: '1px solid rgba(45, 122, 58, 0.1)',
            }}
          >
            <span className="text-base">📊</span>
            <p className="text-[14px] text-slate-600">
              Top 10 average:{' '}
              <span className="font-semibold" style={{ color: '#2D7A3A' }}>
                {formatAverage(activeCategoryData.topTenAverage, activeCategory)}{' '}
                {activeCategoryData.players[0]?.statUnit}
              </span>
            </p>
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
          className="mt-4"
        >
          <LeaderboardList players={restOfList} />
        </motion.div>
      </AnimatePresence>

      {/* View All Button */}
      <div className="px-4 mt-4">
        <button
          onClick={() => navigate('/tourhub/stats')}
          className="w-full py-3.5 rounded-xl border transition-all duration-150 active:scale-[0.98]"
          style={{
            background: 'rgba(0, 0, 0, 0.03)',
            borderColor: 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span>{activeCategoryData?.icon}</span>
            <span className="font-medium text-slate-700 text-[15px]">
              View All {activeCategoryData?.name} Stats
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>
      </div>
    </section>
  );
}
