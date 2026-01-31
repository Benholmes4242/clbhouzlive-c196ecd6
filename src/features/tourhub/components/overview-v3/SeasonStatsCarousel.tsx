/**
 * SeasonStatsCarousel - Cinematic carousel for Season Stats Leaders
 * Replaces the list-based SeasonStatsShowcase with immersive player cards
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSeasonStats } from '../../hooks/useOverviewModules';
import { StatLeaderCard } from './StatLeaderCard';
import { StatLeaderBottomSheet } from './StatLeaderBottomSheet';
import { STAT_CATEGORIES, STAT_LEADER_CARD, type StatCategoryId } from './statLeaderStyles';

export function SeasonStatsCarousel() {
  const [selectedCategory, setSelectedCategory] = useState<StatCategoryId>(STAT_CATEGORIES[0].id);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data, isLoading } = useSeasonStats();
  
  const currentCategory = STAT_CATEGORIES.find(c => c.id === selectedCategory)!;
  const topPlayers = data?.categories?.[selectedCategory] || [];

  // Handle scroll to track progress
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    }
  }, []);

  // Handle card tap
  const handleCardTap = (player: any) => {
    setSelectedPlayer(player);
    setBottomSheetOpen(true);
  };

  // Handle category change - reset scroll
  const handleCategoryChange = (categoryId: StatCategoryId) => {
    setSelectedCategory(categoryId);
    setScrollProgress(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4">
          <div className="h-6 w-32 bg-slate-100 rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-slate-100 rounded animate-pulse mb-4" />
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 w-24 bg-slate-100 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="flex gap-4">
            {[1, 2].map(i => (
              <div 
                key={i} 
                className="flex-shrink-0 bg-slate-100 rounded-[22px] animate-pulse"
                style={{ width: STAT_LEADER_CARD.width, height: STAT_LEADER_CARD.height }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no data
  if (!data?.categories || Object.keys(data.categories).length === 0) {
    return null;
  }

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between px-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img 
              src="/tour-logos/pga-tour.webp" 
              alt="PGA Tour" 
              className="h-5 w-auto"
            />
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {data?.year} Season
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Season Stats Leaders</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Who dominated each statistical category?
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 w-16 bg-slate-200 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-slate-800 rounded-full transition-all duration-150"
            style={{ width: `${Math.max(10, scrollProgress)}%` }}
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {STAT_CATEGORIES.map(category => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <motion.button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                isSelected
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Category Description */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <p className="text-sm font-medium text-slate-700">
          {currentCategory.icon} {currentCategory.fullLabel}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {currentCategory.description}
        </p>
      </div>

      {/* Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 scrollbar-hide"
            style={{ 
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            onScroll={handleScroll}
          >
            {topPlayers.map((player, index) => (
              <StatLeaderCard
                key={player.playerId}
                player={{
                  id: player.playerId,
                  firstName: player.firstName,
                  lastName: player.lastName,
                  photoUrl: player.photoUrl,
                }}
                rank={index + 1}
                statValue={player.displayValue}
                statUnit={currentCategory.unit}
                index={index}
                onTap={() => handleCardTap(player)}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Fun Fact Footer */}
      {topPlayers.length > 0 && (
        <div className="px-4 mt-2">
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <p className="text-sm text-slate-600">
              {selectedCategory === 'driving_distance' && (
                <>💨 The top 10 averaged <span className="font-bold">{getTopTenAverage(topPlayers, 'yds')} yards</span> off the tee!</>
              )}
              {selectedCategory === 'driving_accuracy' && (
                <>🎯 These players found <span className="font-bold">{getTopTenAverage(topPlayers, '%')}%</span> of fairways on average!</>
              )}
              {selectedCategory === 'scrambling' && (
                <>🔄 Elite scramblers saved par <span className="font-bold">{getTopTenAverage(topPlayers, '%')}%</span> of the time!</>
              )}
              {selectedCategory === 'putting' && (
                <>🕳️ Best putters averaged just <span className="font-bold">{getTopTenAverage(topPlayers, 'putts')}</span> putts per hole!</>
              )}
              {selectedCategory === 'sg_total' && (
                <>📊 Top performers gained <span className="font-bold">+{getTopTenAverage(topPlayers, '')}</span> strokes per round vs the field!</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      <StatLeaderBottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        player={selectedPlayer}
        currentCategory={selectedCategory}
        allCategories={data?.categories || {}}
      />
    </section>
  );
}

// Helper to calculate top 10 average
function getTopTenAverage(players: any[], unit: string): string {
  if (!players?.length) return '0';
  const top10 = players.slice(0, 10);
  const avg = top10.reduce((sum, p) => sum + p.value, 0) / top10.length;
  
  if (unit === 'putts') return avg.toFixed(3);
  if (unit === '') return avg.toFixed(2);
  return avg.toFixed(1);
}
