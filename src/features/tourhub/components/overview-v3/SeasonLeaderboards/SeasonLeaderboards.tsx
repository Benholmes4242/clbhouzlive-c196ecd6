/**
 * SeasonLeaderboards - Premium Season Stats with Category Accent Colors
 * 
 * Features:
 * - Category-specific accent colors throughout
 * - Unified card layout with gradient glows
 * - Typography-led with monospace stats
 * - Smooth tab transitions
 * - Entrance animations
 */

import { useState, memo, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonLeaderboards, CATEGORY_CONFIG as CATEGORY_DATA_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { CategoryTabs } from './CategoryTabs';
import { LeaderHero } from './LeaderHero';
import { ChasingPack } from './ChasingPack';
import { AvgStrip } from './AvgStrip';
import { LeaderboardList } from './LeaderboardList';
import { ViewAllFooter } from './ViewAllFooter';
import { SeasonToggle } from './SeasonToggle';
import { CATEGORY_CONFIG, CATEGORY_ACCENT_COLORS } from './constants';
import { CATEGORY_ICONS, BarChartIcon, type CategoryId } from './StatCategoryIcons';

// Animation keyframes
const animationStyles = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

/** Skeleton loader with shimmer */
const SeasonLeaderboardsSkeleton = memo(function SeasonLeaderboardsSkeleton() {
  const shimmerBg = {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
  };

  return (
    <section style={{ paddingTop: '20px', paddingBottom: '16px' }}>
      <style>{animationStyles}</style>
      
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="h-3 w-24 rounded mb-2" style={shimmerBg} />
        <div className="h-7 w-40 rounded" style={shimmerBg} />
      </div>
      
      {/* Category pills skeleton */}
      <div className="flex gap-2 px-4 mb-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 rounded-[10px] flex-shrink-0" style={shimmerBg} />
        ))}
      </div>

      {/* Stat descriptor */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-8 h-8 rounded-[10px]" style={shimmerBg} />
        <div className="flex-1">
          <div className="h-4 w-24 rounded mb-1" style={shimmerBg} />
          <div className="h-3 w-40 rounded" style={shimmerBg} />
        </div>
      </div>
      
      {/* Leader card skeleton */}
      <div 
        className="mx-4 rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.06)', background: '#FFFFFF', padding: '24px 20px' }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl" style={shimmerBg} />
          <div className="flex-1">
            <div className="h-5 w-32 rounded mb-2" style={shimmerBg} />
            <div className="h-3 w-20 rounded" style={shimmerBg} />
          </div>
        </div>
        <div className="h-12 w-28 rounded mt-4" style={shimmerBg} />
        <div className="h-3 w-36 rounded mt-2" style={shimmerBg} />
      </div>
    </section>
  );
});

// Empty state
const SeasonLeaderboardsEmpty = memo(function SeasonLeaderboardsEmpty() {
  return (
    <section style={{ paddingTop: '20px', paddingBottom: '16px' }}>
      <div className="px-4">
        <p 
          className="m-0"
          style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'rgba(0, 0, 0, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
          }}
        >
          2025 Season
        </p>
        <h2 
          className="m-0 mt-1"
          style={{ 
            fontSize: '22px', 
            fontWeight: 700, 
            color: '#111827',
            letterSpacing: '-0.3px',
          }}
        >
          Season Leaders
        </h2>
      </div>
      <div 
        className="mx-4 mt-4 p-8 text-center rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <BarChartIcon size={32} style={{ color: 'rgba(0, 0, 0, 0.2)' }} />
          <h3 className="font-semibold text-slate-900 m-0">No Stats Available</h3>
          <p className="text-sm text-slate-500 m-0">
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { data, isLoading, error } = useSeasonLeaderboards(selectedYear);

  // Set initial year once data loads (defaults to newest)
  useEffect(() => {
    if (data && selectedYear === undefined) {
      setSelectedYear(data.year);
    }
  }, [data, selectedYear]);

  // Trigger load animation
  useEffect(() => {
    if (data && !isLoading) {
      const timer = setTimeout(() => setIsLoaded(true), 50);
      return () => clearTimeout(timer);
    }
  }, [data, isLoading]);

  // Handle category change with transition
  const handleCategoryChange = (newCategory: CategoryId) => {
    if (newCategory === activeCategory) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveCategory(newCategory);
      setIsTransitioning(false);
    }, 150);
  };

  // Loading state
  if (isLoading) {
    return <SeasonLeaderboardsSkeleton />;
  }

  // Error or no data state
  if (error || !data?.categories?.length) {
    return <SeasonLeaderboardsEmpty />;
  }

  const activeCategoryData = data.categories.find((c) => c.id === activeCategory);
  const leader = activeCategoryData?.players[0];
  const chasers = activeCategoryData?.players.slice(1, 3) || [];
  const restOfList = activeCategoryData?.players.slice(3, 10) || [];
  const categoryConfig = CATEGORY_DATA_CONFIG[activeCategory];
  const accent = CATEGORY_ACCENT_COLORS[activeCategory];

  // Format the top 10 average for display
  const formatAverage = (avg: number, categoryId: CategoryId) => {
    const config = CATEGORY_DATA_CONFIG[categoryId];
    if (!config) return avg.toFixed(1);
    return config.formatValue(avg);
  };

  const IconComponent = CATEGORY_ICONS[activeCategory];

  return (
    <section style={{ paddingTop: '24px', paddingBottom: '16px' }}>
      <style>{animationStyles}</style>
      
      {/* Section Header */}
      <motion.div 
        className="flex items-end justify-between px-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '14px' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <p 
              className="m-0"
              style={{ 
                fontSize: '11px', 
                fontWeight: 600, 
                color: 'rgba(0, 0, 0, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
              }}
            >
              {data.year} Season
            </p>
            {/* Season Toggle - inline */}
            <SeasonToggle
              availableSeasons={data.availableSeasons}
              selectedYear={selectedYear ?? data.year}
              onYearChange={setSelectedYear}
            />
          </div>
          <h2 
            className="m-0 mt-1"
            style={{ 
              fontSize: '22px', 
              fontWeight: 700, 
              color: '#111827',
              letterSpacing: '-0.3px',
            }}
          >
            Season Leaders
          </h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub/stats')}
          className="flex items-center gap-0.5 transition-all duration-300 bg-transparent border-none cursor-pointer group"
          style={{ color: 'rgba(0, 0, 0, 0.35)', fontSize: '13px', fontWeight: 600 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#3478F6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(0, 0, 0, 0.35)';
          }}
        >
          View All
          <ChevronRight 
            size={14} 
            className="transition-transform duration-300 group-hover:translate-x-0.5" 
          />
        </button>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <CategoryTabs
          categories={CATEGORY_CONFIG}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </motion.div>

      {/* Stat Descriptor Row */}
      <motion.div 
        className="px-4 mt-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '14px' }}
      >
        <div className="flex items-center py-3" style={{ gap: '10px' }}>
          {/* Icon container with accent background */}
          <div 
            className="flex items-center justify-center flex-shrink-0 transition-colors duration-300"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: accent.bgMedium,
            }}
          >
            <IconComponent size={16} style={{ color: accent.primary, transition: 'color 0.3s ease' }} />
          </div>
          <div>
            <h3 
              className="m-0"
              style={{ 
                fontSize: '16px', 
                fontWeight: 700, 
                color: '#111827',
              }}
            >
              {activeCategoryData?.name}
            </h3>
            <p 
              className="m-0"
              style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.4)', marginTop: '2px' }}
            >
              {activeCategoryData?.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ UNIFIED LEADERBOARD CARD ═══ */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeCategory}
          className="mx-4 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 8 }}
          animate={{ 
            opacity: isTransitioning ? 0.6 : 1, 
            y: isTransitioning ? -4 : 0 
          }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1,
          }}
          style={{ 
            background: '#FFFFFF',
            border: `1px solid ${accent.border}`,
            boxShadow: `0 2px 8px ${accent.bgLight}`,
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {/* Leader Hero */}
          {leader && (
            <LeaderHero 
              player={leader} 
              accentColor={activeCategory}
            />
          )}

          {/* Chasing Pack (#2 and #3) */}
          {chasers.length > 0 && leader && (
            <ChasingPack
              players={chasers}
              leaderValue={leader.statValue}
              higherIsBetter={categoryConfig?.higherIsBetter ?? true}
              unit={leader.statUnit}
              accentColor={activeCategory}
            />
          )}

          {/* Top-10 Average Strip */}
          {activeCategoryData && activeCategoryData.topTenAverage > 0 && (
            <AvgStrip
              average={formatAverage(activeCategoryData.topTenAverage, activeCategory)}
              unit={activeCategoryData.players[0]?.statUnit || ''}
              accentColor={activeCategory}
            />
          )}

          {/* Leaderboard List - Positions 4-10 */}
          <LeaderboardList 
            players={restOfList} 
            accentColor={activeCategory}
          />

          {/* View All Footer */}
          {activeCategoryData && (
            <ViewAllFooter 
              categoryName={activeCategoryData.name} 
              accentColor={activeCategory}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
