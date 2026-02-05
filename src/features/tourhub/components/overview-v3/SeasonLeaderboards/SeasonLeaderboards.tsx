/**
 * SeasonLeaderboards - Complete Rebuild (PGA broadcast meets F1 data-display)
 * 
 * Features:
 * - Unified card layout (no podium visuals)
 * - Typography-led, flat design
 * - SVG icons (no emojis)
 * - No gold/silver/bronze
 */

import { useState, memo, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSeasonLeaderboards, CATEGORY_CONFIG as CATEGORY_DATA_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { CategoryTabs } from './CategoryTabs';
import { LeaderHero } from './LeaderHero';
import { ChasingPack } from './ChasingPack';
import { AvgStrip } from './AvgStrip';
import { LeaderboardList } from './LeaderboardList';
import { ViewAllFooter } from './ViewAllFooter';
import { SeasonToggle } from './SeasonToggle';
import { CATEGORY_CONFIG } from './constants';
import { CATEGORY_ICONS, BarChartIcon, type CategoryId } from './StatCategoryIcons';
import type { LeaderboardPlayer } from './types';

// Shimmer keyframe (locally defined)
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

/** Skeleton loader with shimmer - matches new unified card layout */
const SeasonLeaderboardsSkeleton = memo(function SeasonLeaderboardsSkeleton() {
  const shimmerBg = {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
  };

  return (
    <section style={{ paddingTop: '20px', paddingBottom: '16px', borderTop: '1px solid #f1f5f9' }}>
      <style>{shimmerStyle}</style>
      
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="h-3 w-24 rounded mb-2" style={shimmerBg} />
        <div className="h-7 w-40 rounded" style={shimmerBg} />
      </div>
      
      {/* Category pills skeleton */}
      <div className="flex gap-1.5 px-4 mb-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full flex-shrink-0" style={shimmerBg} />
        ))}
      </div>

      {/* Stat descriptor */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-[34px] h-[34px] rounded-[9px]" style={shimmerBg} />
        <div className="flex-1">
          <div className="h-4 w-24 rounded mb-1" style={shimmerBg} />
          <div className="h-3 w-40 rounded" style={shimmerBg} />
        </div>
      </div>
      
      {/* Unified card skeleton */}
      <div 
        className="mx-4 rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.06)', background: '#FFFFFF' }}
      >
        {/* Leader skeleton */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full" style={shimmerBg} />
            <div className="flex-1">
              <div className="h-4 w-32 rounded mb-2" style={shimmerBg} />
              <div className="h-3 w-20 rounded" style={shimmerBg} />
            </div>
          </div>
          <div className="h-10 w-24 rounded mt-4" style={shimmerBg} />
          <div className="h-3 w-36 rounded mt-2" style={shimmerBg} />
        </div>

        {/* Chaser rows skeleton */}
        <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="w-5 h-5 rounded-full" style={shimmerBg} />
              <div className="w-[38px] h-[38px] rounded-full" style={shimmerBg} />
              <div className="flex-1">
                <div className="h-3.5 w-28 rounded mb-1" style={shimmerBg} />
                <div className="h-2.5 w-16 rounded" style={shimmerBg} />
              </div>
              <div className="h-4 w-12 rounded" style={shimmerBg} />
            </div>
          ))}
        </div>

        {/* Avg strip skeleton */}
        <div 
          className="px-4 py-2.5 flex items-center justify-center"
          style={{ borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
        >
          <div className="h-4 w-40 rounded" style={shimmerBg} />
        </div>

        {/* Row skeletons */}
        {[4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-2.5 px-3.5 h-[66px]">
            <div className="w-6 h-4 rounded" style={shimmerBg} />
            <div className="w-[38px] h-[38px] rounded-full" style={shimmerBg} />
            <div className="flex-1">
              <div className="h-3.5 w-24 rounded mb-1" style={shimmerBg} />
              <div className="h-2.5 w-16 rounded" style={shimmerBg} />
            </div>
            <div className="h-4 w-12 rounded" style={shimmerBg} />
          </div>
        ))}

        {/* Footer skeleton */}
        <div 
          className="px-4 py-3.5 flex items-center justify-center"
          style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
        >
          <div className="h-4 w-32 rounded" style={shimmerBg} />
        </div>
      </div>
    </section>
  );
});

// Empty state
const SeasonLeaderboardsEmpty = memo(function SeasonLeaderboardsEmpty() {
  return (
    <section style={{ paddingTop: '20px', paddingBottom: '16px', borderTop: '1px solid #f1f5f9' }}>
      <div className="px-4">
        <p 
          className="m-0"
          style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: 'rgba(11,18,32,0.38)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          2025 Season
        </p>
        <h2 
          className="m-0 mt-1"
          style={{ 
            fontSize: '23px', 
            fontWeight: 800, 
            color: '#0B1220',
            letterSpacing: '-0.03em',
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
          <BarChartIcon size={32} style={{ color: 'rgba(11,18,32,0.2)' }} />
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

  // Reset loaded state on category change for animation
  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, [activeCategory]);

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

  // Format the top 10 average for display
  const formatAverage = (avg: number, categoryId: CategoryId) => {
    const config = CATEGORY_DATA_CONFIG[categoryId];
    if (!config) return avg.toFixed(1);
    return config.formatValue(avg);
  };

  const IconComponent = CATEGORY_ICONS[activeCategory];

  return (
    <section style={{ paddingTop: '20px', paddingBottom: '16px', borderTop: '1px solid #f1f5f9' }}>
      <style>{shimmerStyle}</style>
      
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p 
              className="m-0"
              style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'rgba(11,18,32,0.38)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
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
              fontSize: '23px', 
              fontWeight: 800, 
              color: '#0B1220',
              letterSpacing: '-0.03em',
            }}
          >
            Season Leaders
          </h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub/stats')}
          className="flex items-center gap-0.5 transition-colors bg-transparent border-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#165A32] focus-visible:outline-offset-2"
          style={{ color: '#165A32', fontSize: '15px', fontWeight: 600 }}
        >
          View All
          <ChevronRight size={14} style={{ color: '#165A32' }} />
        </button>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={CATEGORY_CONFIG}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Stat Descriptor Row */}
      <div className="px-4 mt-3">
        <div className="flex items-center py-3" style={{ gap: '10px' }}>
          {/* Icon container */}
          <div 
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(22,90,50,0.08), rgba(22,90,50,0.02))',
            }}
          >
            <IconComponent size={16} style={{ color: '#165A32' }} />
          </div>
          <div>
            <h3 
              className="m-0"
              style={{ 
                fontSize: '17px', 
                fontWeight: 700, 
                color: '#0B1220',
                letterSpacing: '-0.01em',
              }}
            >
              {activeCategoryData?.name}
            </h3>
            <p 
              className="m-0"
              style={{ fontSize: '12px', color: 'rgba(11,18,32,0.42)' }}
            >
              {activeCategoryData?.description}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ UNIFIED LEADERBOARD CARD ═══ */}
      <div 
        className="mx-4 rounded-2xl overflow-hidden"
        style={{ 
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        {/* Leader Hero */}
        {leader && <LeaderHero player={leader} />}

        {/* Chasing Pack (#2 and #3) */}
        {chasers.length > 0 && leader && (
          <ChasingPack
            players={chasers}
            leaderValue={leader.statValue}
            higherIsBetter={categoryConfig?.higherIsBetter ?? true}
            unit={leader.statUnit}
          />
        )}

        {/* Top-10 Average Strip */}
        {activeCategoryData && activeCategoryData.topTenAverage > 0 && (
          <AvgStrip
            average={formatAverage(activeCategoryData.topTenAverage, activeCategory)}
            unit={activeCategoryData.players[0]?.statUnit || ''}
          />
        )}

        {/* Leaderboard List - Positions 4-10 */}
        <LeaderboardList players={restOfList} />

        {/* View All Footer */}
        {activeCategoryData && (
          <ViewAllFooter categoryName={activeCategoryData.name} />
        )}
      </div>
    </section>
  );
}
