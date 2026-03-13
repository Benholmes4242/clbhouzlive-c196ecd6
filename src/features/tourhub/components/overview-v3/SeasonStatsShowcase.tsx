/**
 * SeasonStatsShowcase - 2025 PGA Tour Season Stats Leaders
 * Top 10 players in 5 statistical categories with tabbed interface
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useSeasonStats } from '../../hooks/useOverviewModules';
import { cn } from '@/lib/utils';

const STAT_CATEGORIES = [
  { 
    id: 'driving_distance', 
    label: 'Distance', 
    fullLabel: 'Driving Distance',
    icon: '🏌️',
    description: 'Average driving distance off the tee',
    color: 'blue',
  },
  { 
    id: 'driving_accuracy', 
    label: 'Accuracy', 
    fullLabel: 'Driving Accuracy',
    icon: '🎯',
    description: 'Percentage of fairways hit',
    color: 'emerald',
  },
  { 
    id: 'scrambling', 
    label: 'Scrambling', 
    fullLabel: 'Scrambling',
    icon: '🔄',
    description: 'Percentage of up-and-downs made',
    color: 'amber',
  },
  { 
    id: 'putting', 
    label: 'Putting', 
    fullLabel: 'Putting Average',
    icon: '🕳️',
    description: 'Average putts per hole',
    color: 'purple',
  },
  { 
    id: 'sg_total', 
    label: 'SG: Total', 
    fullLabel: 'Strokes Gained: Total',
    icon: '📊',
    description: 'Total strokes gained vs field average',
    color: 'rose',
  },
] as const;

const COLOR_CLASSES = {
  blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  rose: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
};

// Helper to calculate top 10 average
const getTopTenAverage = (players: any[], categoryId: string) => {
  if (!players?.length) return '0';
  const top10 = players.slice(0, 10);
  const avg = top10.reduce((sum, p) => sum + p.value, 0) / top10.length;
  // Format based on category
  if (categoryId === 'putting') return avg.toFixed(3);
  if (categoryId === 'sg_total') return avg.toFixed(2);
  return avg.toFixed(1);
};

export const SeasonStatsShowcase = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('driving_distance');
  const { data, isLoading } = useSeasonStats();
  
  const currentCategory = STAT_CATEGORIES.find(c => c.id === selectedCategory)!;
  const colors = COLOR_CLASSES[currentCategory.color as keyof typeof COLOR_CLASSES];
  const topPlayers = data?.categories?.[selectedCategory] || [];
  
  if (isLoading) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4">
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-4" />
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
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
      <div className="px-4 mb-4">
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
      
      {/* Category Tabs - Horizontal Scroll */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {STAT_CATEGORIES.map(category => {
          const isSelected = selectedCategory === category.id;
          const catColors = COLOR_CLASSES[category.color as keyof typeof COLOR_CLASSES];
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                isSelected
                  ? `${catColors.bg} text-white shadow-lg`
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Category Description */}
      <div className={cn("mx-4 mb-4 p-3 rounded-xl", colors.light)}>
        <p className={cn("text-sm font-medium", colors.text)}>
          {currentCategory.icon} {currentCategory.fullLabel}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {currentCategory.description}
        </p>
      </div>
      
      {/* Top 10 Leaderboard */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {topPlayers.slice(0, 10).map((player, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const medalColors = {
                1: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
                2: 'bg-gradient-to-r from-slate-300 to-slate-400 text-white',
                3: 'bg-gradient-to-r from-amber-600 to-orange-700 text-white',
              };
              
              return (
                <button
                  key={player.playerId}
                  onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    isTop3 ? "bg-white shadow-md border border-slate-100" : "hover:bg-slate-50"
                  )}
                >
                  {/* Rank Badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    isTop3 
                      ? medalColors[rank as 1 | 2 | 3]
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {rank}
                  </div>
                  
                  {/* Player Photo */}
                  <div className={cn(
                    "w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-100",
                    isTop3 ? "ring-2 ring-offset-2" : "",
                    rank === 1 ? "ring-amber-400" : 
                    rank === 2 ? "ring-slate-300" : 
                    rank === 3 ? "ring-amber-600" : ""
                  )}>
                    {player.photoUrl ? (
                      <img 
                        src={player.photoUrl}
                        alt={player.lastName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <span className="text-sm font-bold text-slate-400">
                          {player.firstName?.[0]}{player.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Player Name */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold truncate",
                      isTop3 ? "text-slate-900" : "text-slate-700"
                    )}>
                      {player.firstName} {player.lastName}
                    </p>
                    {isTop3 && rank === 1 && (
                      <p className="text-xs text-amber-600 font-medium">
                        👑 Season Leader
                      </p>
                    )}
                  </div>
                  
                  {/* Stat Value */}
                  <div className={cn(
                    "text-right",
                    isTop3 ? "text-lg font-bold" : "text-base font-semibold",
                    colors.text
                  )}>
                    {player.displayValue}
                  </div>
                  
                  {/* Chevron */}
                  <ChevronRight className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isTop3 ? "text-slate-400" : "text-slate-300"
                  )} />
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Fun Fact Footer */}
      {topPlayers.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600">
              {selectedCategory === 'driving_distance' && (
                <>💨 The top 10 averaged <span className="font-bold">{getTopTenAverage(topPlayers, selectedCategory)} yards</span> off the tee!</>
              )}
              {selectedCategory === 'driving_accuracy' && (
                <>🎯 These players found <span className="font-bold">{getTopTenAverage(topPlayers, selectedCategory)}%</span> of fairways on average!</>
              )}
              {selectedCategory === 'scrambling' && (
                <>🔄 Elite scramblers saved par <span className="font-bold">{getTopTenAverage(topPlayers, selectedCategory)}%</span> of the time!</>
              )}
              {selectedCategory === 'putting' && (
                <>🕳️ Best putters averaged just <span className="font-bold">{getTopTenAverage(topPlayers, selectedCategory)}</span> putts per hole!</>
              )}
              {selectedCategory === 'sg_total' && (
                <>📊 Top performers gained <span className="font-bold">+{getTopTenAverage(topPlayers, selectedCategory)}</span> strokes per round vs the field!</>
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
