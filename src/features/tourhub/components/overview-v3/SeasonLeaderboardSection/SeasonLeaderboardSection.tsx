/**
 * SeasonLeaderboardSection - Complete Redesign
 * 
 * PGA broadcast meets F1 data-display visual language:
 * - Editorial, flat, typography-led, premium
 * - Header row with title + "View All"
 * - LeaderSummaryCard (hero with leader + chasing pack)
 * - Top-10 average micro-stat strip
 * - Leaderboard list for ranks 4-10
 */

import { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSeasonLeaderboards, CATEGORY_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { LeaderSummaryCard } from './LeaderSummaryCard';
import { LeaderboardRowV2 } from './LeaderboardRowV2';
import type { CategoryId, LeaderEntry } from './types';

// ============================================
// SKELETON LOADER
// ============================================

const SeasonLeaderboardSkeleton = memo(function SeasonLeaderboardSkeleton() {
  return (
    <section className="py-6 px-4 bg-[#F7F8FA]">
      {/* Header skeleton */}
      <div className="mb-3">
        <div 
          className="h-[26px] w-52 rounded-md mb-1"
          style={{
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
        <div 
          className="h-4 w-32 rounded"
          style={{
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      </div>
      
      {/* Card skeleton */}
      <div 
        className="h-[240px] rounded-2xl"
        style={{
          background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
      
      {/* List skeleton */}
      <div className="mt-4 rounded-2xl overflow-hidden bg-white">
        {[4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 px-4"
            style={{ 
              height: '72px',
              borderBottom: i < 10 ? '1px solid rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <div 
              className="w-8 h-5 rounded"
              style={{
                background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
              }}
            />
            <div 
              className="w-[46px] h-[46px] rounded-full"
              style={{
                background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
              }}
            />
            <div className="flex-1 space-y-1.5">
              <div 
                className="h-4 w-28 rounded"
                style={{
                  background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite linear',
                }}
              />
              <div 
                className="h-3 w-20 rounded"
                style={{
                  background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite linear',
                }}
              />
            </div>
            <div 
              className="h-5 w-14 rounded"
              style={{
                background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
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

// ============================================
// EMPTY STATE
// ============================================

const SeasonLeaderboardEmpty = memo(function SeasonLeaderboardEmpty() {
  return (
    <section className="py-6 px-4 bg-[#F7F8FA]">
      <div className="mb-3">
        <h2 className="text-[24px] font-semibold text-[#0B1220]">
          Season Leaders
        </h2>
        <p className="text-[14px] text-[rgba(11,18,32,0.65)] mt-0.5">
          PGA Tour Season
        </p>
      </div>
      <div className="bg-white rounded-2xl p-8 text-center border border-[rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📊</span>
          <h3 className="font-semibold text-[#0B1220]">No Stats Available</h3>
          <p className="text-sm text-[rgba(11,18,32,0.65)]">
            Season statistics will appear here once available.
          </p>
        </div>
      </div>
    </section>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export function SeasonLeaderboardSection() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  
  // Default to 'distance' category for now (could be made configurable)
  const activeCategory: CategoryId = 'distance';
  
  const { data, isLoading, error } = useSeasonLeaderboards(selectedYear);

  // Set initial year once data loads
  useEffect(() => {
    if (data && selectedYear === undefined) {
      setSelectedYear(data.year);
    }
  }, [data, selectedYear]);

  // Loading state
  if (isLoading) {
    return <SeasonLeaderboardSkeleton />;
  }

  // Error or no data state
  if (error || !data?.categories?.length) {
    return <SeasonLeaderboardEmpty />;
  }

  // Get category data
  const categoryData = data.categories.find((c) => c.id === activeCategory);
  if (!categoryData || categoryData.players.length === 0) {
    return <SeasonLeaderboardEmpty />;
  }

  const config = CATEGORY_CONFIG[activeCategory];
  const statLabel = config.name;
  const unitLabel = config.unit;

  // Map to LeaderEntry shape
  const leaders: LeaderEntry[] = categoryData.players.map((p) => ({
    rank: p.rank,
    playerId: p.playerId,
    playerName: p.playerName,
    firstName: p.firstName,
    lastName: p.lastName,
    countryCode: p.countryCode,
    photoUrl: p.photoUrl,
    initials: p.initials,
    statValue: p.statValue,
    statDisplayValue: p.statDisplayValue,
    statUnit: p.statUnit,
  }));

  const leader = leaders[0];
  const chaser2 = leaders[1] || null;
  const chaser3 = leaders[2] || null;
  const restOfList = leaders.slice(3, 10);

  const handleViewAll = () => {
    navigate('/tourhub/stats');
  };

  return (
    <section className="py-6 bg-[#F7F8FA]">
      {/* Header Row */}
      <div className="flex items-start justify-between px-4 mb-3">
        <div>
          <h2 className="text-[24px] font-semibold text-[#0B1220] leading-tight">
            Season Leaders — {statLabel}
          </h2>
          <p className="text-[14px] text-[rgba(11,18,32,0.65)] mt-0.5">
            {data.year} PGA Tour Season
          </p>
        </div>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-0.5 text-[15px] font-medium text-[rgba(11,18,32,0.65)] hover:text-[#0B1220] transition-colors pt-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Leader Summary Card */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${selectedYear}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LeaderSummaryCard
              leader={leader}
              chaser2={chaser2}
              chaser3={chaser3}
              unitLabel={unitLabel}
              topTenAverage={categoryData.topTenAverage}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Leaderboard List (Ranks 4-10) */}
      {restOfList.length > 0 && (
        <div className="mt-4 mx-4 bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`list-${activeCategory}-${selectedYear}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              role="list"
              aria-label="Season leaderboard ranks 4 through 10"
            >
              {restOfList.map((player, idx) => (
                <LeaderboardRowV2
                  key={player.playerId}
                  player={player}
                  animationDelay={0.05 * idx}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* View All Button */}
      <div className="px-4 mt-4">
        <button
          onClick={handleViewAll}
          className="w-full py-3.5 rounded-xl border transition-all duration-150 active:scale-[0.98] bg-white"
          style={{
            borderColor: 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span>{categoryData.icon}</span>
            <span className="font-medium text-[#0B1220] text-[15px]">
              View All {statLabel} Stats
            </span>
            <ChevronRight className="w-4 h-4 text-[rgba(11,18,32,0.45)]" />
          </div>
        </button>
      </div>
    </section>
  );
}
