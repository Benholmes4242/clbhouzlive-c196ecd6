/**
 * SeasonLeaderboards - Apple-grade Season Stats Module
 * 
 * Features:
 * - Compact horizontal podium layout (2nd, 1st, 3rd)
 * - Gold/Silver/Bronze gradient card backgrounds
 * - Consistent list styling matching World Rankings
 * - Category filter pills with branded green selection
 * - Top 10 summary banner
 * - Shimmer loading states
 */

import { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSeasonLeaderboards, CATEGORY_CONFIG as CATEGORY_DATA_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { SeasonToggle } from './SeasonToggle';
import { CATEGORY_CONFIG } from './constants';
import type { CategoryId, LeaderboardPlayer } from './types';
import CountryFlag from '@/components/ui/country-flag';
import { getPgaTourHeadshotUrl } from '../../../utils/resolvePhotoUrl';

// ============================================
// SKELETON LOADING
// ============================================

function PodiumSkeleton() {
  return (
    <div className="flex items-end justify-center gap-2 py-5 px-4">
      {/* 2nd place - left */}
      <div 
        className="flex flex-col items-center p-4 rounded-2xl"
        style={{ 
          width: '100px', 
          height: '140px',
          background: 'linear-gradient(180deg, rgba(192, 192, 192, 0.08) 0%, white 100%)',
          border: '1px solid rgba(192, 192, 192, 0.3)',
        }}
      >
        <div 
          className="w-12 h-5 rounded-xl mb-3"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
          }}
        />
        <div 
          className="w-[52px] h-[52px] rounded-full mb-2.5"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.05s',
          }}
        />
        <div 
          className="w-16 h-3.5 rounded mb-1"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.1s',
          }}
        />
        <div 
          className="w-12 h-5 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.15s',
          }}
        />
      </div>
      
      {/* 1st place - center (taller) */}
      <div 
        className="flex flex-col items-center p-4 rounded-2xl"
        style={{ 
          width: '120px', 
          height: '160px',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, white 100%)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}
      >
        <div 
          className="w-14 h-6 rounded-xl mb-3"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.1s',
          }}
        />
        <div 
          className="w-16 h-16 rounded-full mb-2.5"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.15s',
          }}
        />
        <div 
          className="w-20 h-3.5 rounded mb-1"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.2s',
          }}
        />
        <div 
          className="w-14 h-5 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.25s',
          }}
        />
      </div>
      
      {/* 3rd place - right */}
      <div 
        className="flex flex-col items-center p-4 rounded-2xl"
        style={{ 
          width: '100px', 
          height: '140px',
          background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.08) 0%, white 100%)',
          border: '1px solid rgba(205, 127, 50, 0.3)',
        }}
      >
        <div 
          className="w-12 h-5 rounded-xl mb-3"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.15s',
          }}
        />
        <div 
          className="w-[52px] h-[52px] rounded-full mb-2.5"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.2s',
          }}
        />
        <div 
          className="w-16 h-3.5 rounded mb-1"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.25s',
          }}
        />
        <div 
          className="w-12 h-5 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.3s',
          }}
        />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      {[4, 5, 6, 7, 8, 9, 10].map((rank, idx) => (
        <div
          key={rank}
          className="flex items-center px-4 py-3.5"
          style={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
            backgroundColor: idx % 2 === 1 ? 'rgba(0, 0, 0, 0.015)' : 'transparent',
          }}
        >
          <div 
            className="w-8 h-5 rounded mr-3"
            style={{ 
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'tourhubShimmer 1.5s infinite',
              animationDelay: `${idx * 0.05}s`,
            }}
          />
          <div 
            className="w-11 h-11 rounded-full mr-3"
            style={{ 
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'tourhubShimmer 1.5s infinite',
              animationDelay: `${idx * 0.05 + 0.02}s`,
            }}
          />
          <div className="flex-1 space-y-1.5">
            <div 
              className="w-24 h-4 rounded"
              style={{ 
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'tourhubShimmer 1.5s infinite',
                animationDelay: `${idx * 0.05 + 0.04}s`,
              }}
            />
            <div 
              className="w-16 h-3 rounded"
              style={{ 
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'tourhubShimmer 1.5s infinite',
                animationDelay: `${idx * 0.05 + 0.06}s`,
              }}
            />
          </div>
          <div 
            className="w-14 h-5 rounded"
            style={{ 
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'tourhubShimmer 1.5s infinite',
              animationDelay: `${idx * 0.05 + 0.08}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

const SeasonLeaderboardsSkeleton = memo(function SeasonLeaderboardsSkeleton() {
  return (
    <section className="pt-6 pb-6 border-t border-slate-100">
      <div className="px-4 mb-4 space-y-1">
        <div 
          className="h-3 w-24 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
          }}
        />
        <div 
          className="h-6 w-44 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'tourhubShimmer 1.5s infinite',
            animationDelay: '0.05s',
          }}
        />
      </div>
      
      {/* Category pills skeleton */}
      <div className="flex gap-2 px-4 mb-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div 
            key={i} 
            className="h-9 w-24 rounded-full flex-shrink-0"
            style={{ 
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'tourhubShimmer 1.5s infinite',
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      
      <PodiumSkeleton />
      <ListSkeleton />
    </section>
  );
});

// ============================================
// CATEGORY PILL
// ============================================

interface CategoryPillProps {
  category: { id: CategoryId; name: string; icon: string };
  isActive: boolean;
  onClick: () => void;
}

function CategoryPill({ category, isActive, onClick }: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      aria-label={`${category.name} category`}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ease-out active:scale-95"
      style={{
        background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
        color: isActive ? '#047857' : '#666',
      }}
    >
      <span className="text-base" style={{ opacity: isActive ? 1 : 0.7 }}>{category.icon}</span>
      <span className="text-[14px] font-medium">{category.name}</span>
    </button>
  );
}

// ============================================
// PODIUM CARD
// ============================================

interface PodiumCardProps {
  player: LeaderboardPlayer;
  rank: 1 | 2 | 3;
  animationDelay: number;
}

const PODIUM_STYLES = {
  1: {
    width: '120px',
    height: '160px',
    avatarSize: 64,
    background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, white 100%)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    badgeBackground: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    badgeTextColor: 'white',
  },
  2: {
    width: '100px',
    height: '140px',
    avatarSize: 52,
    background: 'linear-gradient(180deg, rgba(192, 192, 192, 0.08) 0%, white 100%)',
    borderColor: 'rgba(192, 192, 192, 0.3)',
    badgeBackground: 'linear-gradient(135deg, #E8E8E8 0%, #B8B8B8 100%)',
    badgeTextColor: '#666',
  },
  3: {
    width: '100px',
    height: '140px',
    avatarSize: 52,
    background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.08) 0%, white 100%)',
    borderColor: 'rgba(205, 127, 50, 0.3)',
    badgeBackground: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)',
    badgeTextColor: 'white',
  },
};

function PodiumCard({ player, rank, animationDelay }: PodiumCardProps) {
  const navigate = useNavigate();
  const style = PODIUM_STYLES[rank];
  const isFirst = rank === 1;
  
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const displayName = player.playerName.length > 10 
    ? `${player.playerName.slice(0, 10)}…` 
    : player.playerName;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="flex flex-col items-center rounded-2xl transition-transform duration-150 ease-out active:scale-[0.97]"
      style={{
        width: style.width,
        height: style.height,
        padding: '16px 12px',
        background: style.background,
        border: `1px solid ${style.borderColor}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Rank Badge */}
      <div
        className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl mb-3"
        style={{
          background: style.badgeBackground,
          color: style.badgeTextColor,
        }}
      >
        {isFirst && <span className="text-xs">🏆</span>}
        <span className="text-[13px] font-bold">#{rank}</span>
      </div>
      
      {/* Avatar */}
      <div
        className="rounded-full overflow-hidden mb-2.5 flex-shrink-0"
        style={{
          width: style.avatarSize,
          height: style.avatarSize,
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-slate-200">
                  <span class="text-sm font-bold text-slate-400">${player.initials}</span>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <span className="text-sm font-bold text-slate-400">{player.initials}</span>
          </div>
        )}
      </div>
      
      {/* Player Name */}
      <p
        className="text-[14px] font-semibold text-slate-900 text-center truncate mb-1"
        style={{ maxWidth: '90px' }}
      >
        {displayName}
      </p>
      
      {/* Stat Value */}
      <div className="flex items-baseline gap-0.5">
        <span className="text-[18px] font-bold" style={{ color: '#007AFF' }}>
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span className="text-[13px] font-medium" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            {player.statUnit}
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ============================================
// LEADERBOARD ROW
// ============================================

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  isEven: boolean;
  animationDelay: number;
}

function LeaderboardRow({ player, isEven, animationDelay }: LeaderboardRowProps) {
  const navigate = useNavigate();
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const displayName = player.playerName.length > 12 
    ? `${player.playerName.slice(0, 12)}…` 
    : player.playerName;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      role="listitem"
      aria-label={`Rank ${player.rank}: ${player.playerName}, ${player.countryCode}, ${player.statDisplayValue} ${player.statUnit}`}
      className="w-full flex items-center px-4 py-3.5 transition-colors duration-150 active:bg-slate-50"
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        backgroundColor: isEven ? 'rgba(0, 0, 0, 0.015)' : 'transparent',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.2 }}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        <span className="text-[15px] font-semibold text-slate-900">{player.rank}</span>
      </div>
      
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full overflow-hidden ml-3 flex-shrink-0"
        style={{
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-slate-200">
                  <span class="text-xs font-bold text-slate-400">${player.initials}</span>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <span className="text-xs font-bold text-slate-400">{player.initials}</span>
          </div>
        )}
      </div>
      
      {/* Player Info */}
      <div className="flex-1 min-w-0 ml-3">
        <p className="text-[15px] font-semibold text-slate-900 truncate leading-tight">
          {displayName}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <div 
            className="overflow-hidden"
            style={{ width: '14px', height: '10px', borderRadius: '1px' }}
          >
            <CountryFlag country={player.countryCode} size="sm" />
          </div>
          <span className="text-[12px]" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            {player.countryCode}
          </span>
        </div>
      </div>
      
      {/* Stat Value */}
      <div className="flex items-baseline gap-0.5 flex-shrink-0">
        <span className="text-[16px] font-semibold" style={{ color: '#007AFF' }}>
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span className="text-[13px]" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
            {player.statUnit}
          </span>
        )}
      </div>
      
      {/* Chevron */}
      <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" style={{ opacity: 0.3 }} />
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SeasonLeaderboards() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('distance');
  
  const { data, isLoading, error } = useSeasonLeaderboards(selectedYear);

  // Set initial year once data loads
  useEffect(() => {
    if (data && selectedYear === undefined) {
      setSelectedYear(data.year);
    }
  }, [data, selectedYear]);

  // Loading state
  if (isLoading) {
    return <SeasonLeaderboardsSkeleton />;
  }

  // Error or no data
  if (error || !data?.categories?.length) {
    return null;
  }

  const activeCategoryData = data.categories.find((c) => c.id === activeCategory);
  const topThree = activeCategoryData?.players.slice(0, 3) || [];
  const restOfList = activeCategoryData?.players.slice(3, 10) || [];

  // Format average
  const formatAverage = (avg: number, categoryId: CategoryId) => {
    const config = CATEGORY_DATA_CONFIG[categoryId];
    if (!config) return avg.toFixed(1);
    return config.formatValue(avg);
  };

  return (
    <section className="pt-6 pb-6 border-t border-slate-100">
      {/* Header - Apple-grade typography */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="space-y-1">
          <p 
            className="text-[11px] font-medium uppercase"
            style={{ color: 'rgba(100, 116, 139, 0.5)', letterSpacing: '0.5px' }}
          >
            {data.year} Season
          </p>
          <h2 
            className="text-[22px] font-semibold text-slate-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Season Leaderboards
          </h2>
        </div>
        
        {/* Season Toggle */}
        <SeasonToggle
          availableSeasons={data.availableSeasons}
          selectedYear={selectedYear ?? data.year}
          onYearChange={setSelectedYear}
        />
      </div>
      
      {/* Category Pills */}
      <div 
        className="flex gap-2 px-4 pb-1 overflow-x-auto scrollbar-hide -mx-4 px-4"
        role="tablist"
        aria-label="Statistical categories"
        style={{
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORY_CONFIG.map((category) => (
          <CategoryPill
            key={category.id}
            category={category}
            isActive={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
          />
        ))}
      </div>
      
      {/* Category Description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2 px-4 py-3 mt-3"
        >
          <span className="text-2xl">{activeCategoryData?.icon}</span>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">{activeCategoryData?.name}</h3>
            <p className="text-[13px]" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
              {activeCategoryData?.description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Podium - Horizontal Layout (2nd, 1st, 3rd) */}
      {topThree.length >= 3 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`podium-${activeCategory}-${selectedYear}`}
            className="flex items-end justify-center gap-2 py-5 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PodiumCard player={topThree[1]} rank={2} animationDelay={0.05} />
            <PodiumCard player={topThree[0]} rank={1} animationDelay={0.1} />
            <PodiumCard player={topThree[2]} rank={3} animationDelay={0.15} />
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Top 10 Summary Banner */}
      {activeCategoryData && activeCategoryData.topTenAverage > 0 && (
        <div className="mx-4 mt-4">
          <div
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl"
            style={{
              background: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.1)',
            }}
          >
            <span className="text-base">📊</span>
            <p className="text-[14px]" style={{ color: '#666' }}>
              Top 10 average:{' '}
              <span className="font-semibold" style={{ color: '#047857' }}>
                {formatAverage(activeCategoryData.topTenAverage, activeCategory)}{' '}
                {activeCategoryData.players[0]?.statUnit}
              </span>
            </p>
          </div>
        </div>
      )}
      
      {/* Leaderboard List - Ranks 4-10 */}
      {restOfList.length > 0 && (
        <div className="mt-4" role="list" aria-label={`${activeCategoryData?.name} leaderboard, showing top 10`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`list-${activeCategory}-${selectedYear}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {restOfList.map((player, idx) => (
                <LeaderboardRow
                  key={player.playerId}
                  player={player}
                  isEven={idx % 2 === 1}
                  animationDelay={0.2 + idx * 0.03}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      
      {/* View All Button */}
      <div className="mt-4 mx-4">
        <button
          onClick={() => navigate('/tourhub/stats')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-150 active:scale-[0.98]"
          style={{
            background: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <span>{activeCategoryData?.icon}</span>
          <span className="text-[15px] font-medium text-slate-900">
            View All {activeCategoryData?.name} Stats
          </span>
          <ChevronRight className="w-4 h-4" style={{ opacity: 0.6 }} />
        </button>
      </div>
    </section>
  );
}
