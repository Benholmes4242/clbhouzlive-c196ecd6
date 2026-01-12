/**
 * LeadersTab - Premium Arena-Style Leaders Page
 * 
 * The season's best — feels like an arena, not a spreadsheet.
 * Features: stadium glow, sticky tier navigation, spotlight podium, premium rows
 * Category selection synced to URL for shareability
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trophy, Target, Gauge, Calendar, DollarSign, Globe, Info, Zap, Crosshair, Circle, Flag, Sun, RefreshCw, Scissors, Crown, Clock } from 'lucide-react';
import { CollegeCrestTile } from '../college';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings, toTitleCase, getInitials } from '../../hooks/useWorldRankings';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { cn } from '@/lib/utils';

interface LeaderCategory {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  getValue: (stats: any) => number | null;
  format: (value: number) => string;
  formatShort: (value: number) => string;
  sortOrder: 'desc' | 'asc';
  isWorldRank?: boolean;
  section: 'season' | 'stats';
}

// Season Performance categories
const seasonCategories: LeaderCategory[] = [
  {
    key: 'world_rank',
    label: 'World Ranking',
    shortLabel: 'World Rank',
    description: 'Official world golf ranking',
    icon: <Globe className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.world_rank,
    format: (v) => `#${v}`,
    formatShort: (v) => `#${v}`,
    sortOrder: 'asc',
    isWorldRank: true,
    section: 'season',
  },
  {
    key: 'events_played',
    label: 'Events Played',
    shortLabel: 'Events',
    description: 'Most tournament appearances this season',
    icon: <Calendar className="w-3.5 h-3.5" />,
    getValue: (s) => s.events_played,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
    section: 'season',
  },
  {
    key: 'cuts_made',
    label: 'Cuts Made',
    shortLabel: 'Cuts',
    description: 'Most weekends made this season',
    icon: <Scissors className="w-3.5 h-3.5" />,
    getValue: (s) => s.cuts_made,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
    section: 'season',
  },
  {
    key: 'top_10',
    label: 'Top 10 Finishes',
    shortLabel: 'Top 10s',
    description: 'Most top 10 finishes this season',
    icon: <Trophy className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.top_10,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
    section: 'season',
  },
  {
    key: 'earnings',
    label: 'Season Earnings',
    shortLabel: 'Earnings',
    description: 'Total prize money earned',
    icon: <DollarSign className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.earnings,
    format: (v) => `$${(v / 1_000_000).toFixed(2)}M`,
    formatShort: (v) => `$${(v / 1_000_000).toFixed(1)}M`,
    sortOrder: 'desc',
    section: 'season',
  },
];

// Ball Striking & Short Game categories
const statsCategories: LeaderCategory[] = [
  {
    key: 'scoring_avg',
    label: 'Scoring Average',
    shortLabel: 'Scoring',
    description: 'Lowest average strokes per round',
    icon: <Gauge className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.scoring_avg,
    format: (v) => v.toFixed(3),
    formatShort: (v) => v.toFixed(2),
    sortOrder: 'asc',
    section: 'stats',
  },
  {
    key: 'drive_avg',
    label: 'Driving Distance',
    shortLabel: 'Distance',
    description: 'Longest average driving distance',
    icon: <Zap className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.drive_avg,
    format: (v) => `${v.toFixed(1)} yds`,
    formatShort: (v) => `${v.toFixed(1)}`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'drive_acc',
    label: 'Driving Accuracy',
    shortLabel: 'Accuracy',
    description: 'Highest fairway hit percentage',
    icon: <Crosshair className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.drive_acc,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'gir_pct',
    label: 'Greens in Regulation',
    shortLabel: 'GIR',
    description: 'Highest greens in regulation percentage',
    icon: <Circle className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.gir_pct,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'putt_avg',
    label: 'Putting Average',
    shortLabel: 'Putting',
    description: 'Lowest putts per hole',
    icon: <Flag className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.putt_avg,
    format: (v) => v.toFixed(3),
    formatShort: (v) => v.toFixed(3),
    sortOrder: 'asc',
    section: 'stats',
  },
  {
    key: 'sand_saves_pct',
    label: 'Sand Saves',
    shortLabel: 'Sand Saves',
    description: 'Highest sand save percentage',
    icon: <Sun className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.sand_saves_pct,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'scrambling_pct',
    label: 'Scrambling',
    shortLabel: 'Scrambling',
    description: 'Highest scrambling percentage',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.scrambling_pct,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
];

// Combined categories for lookup
const leaderCategories: LeaderCategory[] = [...seasonCategories, ...statsCategories];
export function LeadersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  // Find category from URL or default to first
  const initialCategory = useMemo(() => {
    if (categoryParam) {
      const found = leaderCategories.find(c => c.key === categoryParam);
      if (found) return found;
    }
    return leaderCategories[0];
  }, [categoryParam]);
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollRef = useRef<number>(0);
  
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { rankedOnly: worldRankedPlayers, isLoading: worldRankLoading } = useWorldRankings();

  const isLoading = statsLoading || worldRankLoading;

  // Sync category with URL on mount
  useEffect(() => {
    if (categoryParam) {
      const found = leaderCategories.find(c => c.key === categoryParam);
      if (found && found.key !== selectedCategory.key) {
        setSelectedCategory(found);
      }
    }
  }, [categoryParam]);

  // Handle category change with transition and URL update
  const handleCategoryChange = (cat: LeaderCategory) => {
    if (cat.key === selectedCategory.key) return;
    scrollRef.current = window.scrollY;
    setIsTransitioning(true);
    setSelectedCategory(cat);
    
    // Update URL with category
    setSearchParams(prev => {
      prev.set('tab', 'leaderboards');
      prev.set('category', cat.key);
      return prev;
    }, { replace: true });
    
    setTimeout(() => setIsTransitioning(false), 150);
  };

  // Restore scroll position after category change
  useEffect(() => {
    if (!isTransitioning && scrollRef.current > 0) {
      window.scrollTo(0, scrollRef.current);
    }
  }, [isTransitioning]);

  // Get sorted players for selected category
  const rankedPlayers = useMemo(() => {
    // For world rank, use the unified hook data
    if (selectedCategory.isWorldRank) {
      return worldRankedPlayers.slice(0, 50).map((p, idx) => ({
        id: p.playerId,
        player_id: p.playerId,
        player: p.player,
        displayRank: idx + 1,
        value: p.worldRank,
      }));
    }

    if (!playerStats) return [];

    return [...playerStats]
      .filter(s => {
        const value = selectedCategory.getValue(s);
        if (selectedCategory.key === 'world_rank') {
          return value !== null && value !== undefined && value > 0 && s.player;
        }
        return value !== null && value !== undefined && s.player;
      })
      .sort((a, b) => {
        const aVal = selectedCategory.getValue(a) || 0;
        const bVal = selectedCategory.getValue(b) || 0;
        
        if (selectedCategory.key === 'world_rank') {
          const aValid = aVal >= 1;
          const bValid = bVal >= 1;
          if (aValid && bValid) return aVal - bVal;
          if (aValid) return -1;
          if (bValid) return 1;
          return 0;
        }
        
        return selectedCategory.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      })
      .slice(0, 50)
      .map((stat, idx) => ({
        id: stat.id,
        player_id: stat.player_id,
        player: stat.player,
        displayRank: idx + 1,
        value: selectedCategory.getValue(stat),
        raw: stat,
      }));
  }, [playerStats, selectedCategory, worldRankedPlayers]);

  // Top 3 for spotlight
  const top3 = rankedPlayers.slice(0, 3);
  const restOfList = rankedPlayers.slice(3);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Chips skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-muted rounded-full w-24 shrink-0" />
          ))}
        </div>
        {/* Spotlight skeleton */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 h-44 bg-muted rounded-2xl" />
          <div className="col-span-2 space-y-3">
            <div className="h-[82px] bg-muted rounded-xl" />
            <div className="h-[82px] bg-muted rounded-xl" />
          </div>
        </div>
        {/* List skeleton */}
        <div className="space-y-0 pt-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50/50 dark:from-background dark:to-background -mx-4 px-4">
      {/* Stadium light glow - subtle radial gradient behind header */}
      <div className="absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none" />

      {/* Page Header - Arena style */}
      <div className="relative pt-6 pb-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Season Leaders
        </h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-slate-500 dark:text-muted-foreground">
            The season's best — updated as the Tour unfolds.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated weekly</span>
          </div>
        </div>
      </div>

      {/* Tier 1: Season Performance - Sticky pill segmented control */}
      <div 
        className="sticky top-[var(--header-h-mobile,44px)] z-20 bg-white/75 dark:bg-background/75 backdrop-blur-md -mx-4 px-4 py-3"
        role="tablist"
        aria-label="Season performance categories"
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {seasonCategories.map((cat) => {
            const isSelected = selectedCategory.key === cat.key;
            return (
              <button
                key={cat.key}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleCategoryChange(cat)}
                className={cn(
                  "relative flex-shrink-0 rounded-sq-pill px-4 py-2 text-sm font-medium whitespace-nowrap",
                  "transition-all duration-200 ease-out",
                  isSelected 
                    ? "bg-white dark:bg-white/10 shadow-sm ring-1 ring-slate-200 dark:ring-white/10 text-foreground" 
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-muted-foreground hover:bg-slate-150 dark:hover:bg-white/8"
                )}
              >
                {cat.shortLabel}
                {/* Orange underline inside active pill */}
                {isSelected && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-orange" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier 2: Ball Striking & Short Game - Scroll rail with fade edges */}
      <div className="relative mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2 px-0.5">
          Ball Striking & Short Game
        </p>
        
        {/* Scroll container with fade masks */}
        <div className="relative">
          {/* Left fade mask */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-background to-transparent z-10 pointer-events-none" />
          {/* Right fade mask */}
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            {statsCategories.map((cat) => {
              const isSelected = selectedCategory.key === cat.key;
              return (
                <button
                  key={cat.key}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "relative flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap",
                    "transition-all duration-200 ease-out",
                    isSelected 
                      ? "font-semibold text-slate-900 dark:text-foreground" 
                      : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground/80"
                  )}
                >
                  {cat.shortLabel}
                  {/* Animated underline */}
                  <div className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-brand-orange",
                    "transition-all duration-200 ease-out",
                    isSelected ? "w-5 opacity-100" : "w-0 opacity-0"
                  )} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content with crossfade transition */}
      <div 
        className={cn(
          "transition-opacity duration-150",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {/* World Rank: Official badge - compact */}
        {selectedCategory.isWorldRank && (
          <div className="flex items-center gap-2 mb-4 px-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Info className="w-3 h-3 text-amber-600" />
              <span className="text-[11px] font-medium text-amber-700">
                Official World Golf Ranking
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Updated weekly
            </span>
          </div>
        )}

        {/* Category description (non-world-rank) */}
        {!selectedCategory.isWorldRank && (
          <p className="text-[13px] text-muted-foreground px-0.5 mb-4">
            {selectedCategory.description}
          </p>
        )}

        {/* Spotlight Top 3 - Podium Style with Photos */}
        {top3.length >= 3 ? (
          <div className="grid grid-cols-5 gap-2.5 mb-2">
            {/* #1 - Champion tile (larger, gold accent) */}
            <Link
              to={`/tourhub/player/${top3[0].player_id}`}
              className="col-span-3 rounded-2xl p-4 transition-all active:scale-[0.98] relative overflow-hidden shadow-sm"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--amber-50, 48 96% 89%) / 0.4) 0%, hsl(var(--background)) 100%)',
                border: '1px solid hsl(var(--amber-200, 48 96% 83%) / 0.5)',
                minHeight: '170px',
              }}
            >
              {/* Subtle texture */}
              <div 
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              />
              
              <div className="relative flex items-start justify-between mb-3">
                {/* Rank badge - Gold */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500 shadow-lg shadow-amber-500/30">
                  <span className="text-lg font-bold text-white">
                    {selectedCategory.isWorldRank ? `#${top3[0].value}` : '1'}
                  </span>
                </div>
                
                {/* Avatar - larger */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-muted/50 border-2 border-amber-400/40 shadow-md overflow-hidden">
                  {resolvePhotoUrl(top3[0].player?.photo_url) ? (
                    <img 
                      src={resolvePhotoUrl(top3[0].player?.photo_url)!} 
                      alt={top3[0].player?.full_name || ''}
                      className="w-full h-full rounded-full object-cover object-top"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-muted-foreground">
                      {getInitials(top3[0].player?.full_name || '')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <p className="text-[17px] font-semibold text-foreground truncate">
                  {top3[0].player?.full_name}
                </p>
                <p className="text-[13px] text-muted-foreground truncate">
                  {toTitleCase(top3[0].player?.country)}
                </p>
                {!selectedCategory.isWorldRank && top3[0].value !== null && (
                  <p className="text-[24px] font-bold text-foreground mt-2">
                    {selectedCategory.format(top3[0].value)}
                  </p>
                )}
              </div>
            </Link>

            {/* #2 and #3 stacked - with photos */}
            <div className="col-span-2 flex flex-col gap-2.5">
              {[top3[1], top3[2]].map((player, idx) => {
                const isSecond = idx === 0;
                const photoUrl = resolvePhotoUrl(player.player?.photo_url);
                
                return (
                  <Link
                    key={player.id}
                    to={`/tourhub/player/${player.player_id}`}
                    className={cn(
                      "flex-1 rounded-xl p-3 transition-all active:scale-[0.98] shadow-sm",
                      isSecond 
                        ? "bg-zinc-100/80 border border-zinc-200/60" 
                        : "bg-amber-50/50 border border-amber-200/40"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {/* Rank badge - Silver or Bronze */}
                      <div 
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                          isSecond ? "bg-zinc-400" : "bg-amber-700"
                        )}
                      >
                        <span className="text-[11px] font-bold text-white">
                          {selectedCategory.isWorldRank ? `#${player.value}` : idx + 2}
                        </span>
                      </div>
                      
                      {/* Photo */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted/50 shrink-0 overflow-hidden">
                        {photoUrl ? (
                          <img 
                            src={photoUrl} 
                            alt={player.player?.full_name || ''}
                            className="w-full h-full rounded-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {getInitials(player.player?.full_name || '')}
                          </span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-foreground truncate">
                          {player.player?.full_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {toTitleCase(player.player?.country)}
                        </p>
                      </div>
                      
                      {/* Value (non-world-rank) */}
                      {!selectedCategory.isWorldRank && player.value !== null && (
                        <span className="text-[11px] font-bold text-foreground shrink-0">
                          {selectedCategory.formatShort(player.value)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : top3.length > 0 ? (
          <div className="space-y-0 mb-2">
            {top3.map((player, idx) => (
              <PlayerRow 
                key={player.id} 
                player={player} 
                rank={idx + 1} 
                category={selectedCategory}
              />
            ))}
          </div>
        ) : null}

        {/* Rest of list - flat editorial rows */}
        {restOfList.length > 0 ? (
          <div className="pt-3">
            {/* Subtle section divider */}
            <div className="h-px bg-border/50 mb-0" />
            
            <div className="divide-y divide-border/30">
              {restOfList.map((player, idx) => (
                <PlayerRow 
                  key={player.id} 
                  player={player} 
                  rank={idx + 4} 
                  category={selectedCategory}
                />
              ))}
            </div>
          </div>
        ) : rankedPlayers.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-muted/30">
            <p className="text-[14px] text-muted-foreground">
              No data available for this category yet.
            </p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">
              Rankings will unlock with live feeds.
            </p>
          </div>
        ) : null}

        {/* Footer note */}
        <div className="text-center pt-6 pb-2">
          <p className="text-[11px] text-muted-foreground/60">
            Season leaders computed from available tournament data
          </p>
        </div>
      </div>
    </div>
  );
}

// Flat row component - editorial style with position numbers
interface PlayerRowProps {
  player: {
    id: string;
    player_id: string;
    player?: {
      full_name: string;
      country?: string | null;
      photo_url?: string | null;
    };
    value: number | null;
  };
  rank: number;
  category: LeaderCategory;
}

function PlayerRow({ player, rank, category }: PlayerRowProps) {
  const displayValue = player.value !== null && player.value !== undefined
    ? category.formatShort(player.value)
    : '—';
  
  const photoUrl = resolvePhotoUrl(player.player?.photo_url);
  const isTop10 = rank <= 10;
  const isTop3 = rank <= 3;

  return (
    <Link
      to={`/tourhub/player/${player.player_id}`}
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-sq-md",
        "bg-white/70 dark:bg-white/5",
        "ring-1 ring-slate-200/60 dark:ring-white/8",
        "hover:bg-white dark:hover:bg-white/8",
        "active:scale-[0.995] active:bg-slate-50 dark:active:bg-white/10",
        "transition-all duration-150 ease-out group"
      )}
    >
      {/* Top 10 accent bar */}
      {isTop10 && (
        <div className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full",
          isTop3 ? "bg-brand-orange" : "bg-brand-orange/60"
        )} />
      )}

      {/* Rank number */}
      <span className={cn(
        "w-8 text-center font-semibold shrink-0 tabular-nums",
        isTop3 ? "text-brand-orange text-base" : "text-muted-foreground text-[13px]"
      )}>
        {rank}
      </span>
      
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-muted/50 overflow-hidden",
        isTop3 && "ring-2 ring-brand-orange/30"
      )}>
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={player.player?.full_name || ''}
            className="w-full h-full rounded-full object-cover object-top"
          />
        ) : (
          <span className="text-[12px] font-semibold text-muted-foreground">
            {getInitials(player.player?.full_name || '')}
          </span>
        )}
      </div>
      
      {/* Name + country */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {player.player?.full_name}
        </p>
        <p className="text-[12px] text-muted-foreground/70 truncate">
          {toTitleCase(player.player?.country)}
        </p>
      </div>
      
      {/* Value */}
      <span className={cn(
        "font-semibold shrink-0 tabular-nums",
        isTop3 ? "text-base text-foreground" : "text-[14px] text-foreground"
      )}>
        {displayValue}
      </span>
    </Link>
  );
}
