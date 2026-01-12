/**
 * LeadersTab - World-Class Leaders Page
 * 
 * Editorial layout: premium podium, flat rows, minimal UI chrome
 * Think: PGA + Apple Fitness + Financial Times data pages
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, Gauge, Award, TrendingUp, DollarSign, Globe } from 'lucide-react';
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
}

const leaderCategories: LeaderCategory[] = [
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
  },
  {
    key: 'events_played',
    label: 'Events Played',
    shortLabel: 'Events Played',
    description: 'Most tournament appearances this season',
    icon: <Award className="w-3.5 h-3.5" />,
    getValue: (s) => s.events_played,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
  },
  {
    key: 'cuts_made',
    label: 'Cuts Made',
    shortLabel: 'Cuts Made',
    description: 'Most weekends made this season',
    icon: <Target className="w-3.5 h-3.5" />,
    getValue: (s) => s.cuts_made,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
  },
  {
    key: 'top_10',
    label: 'Top 10 Finishes',
    shortLabel: 'Top 10s',
    description: 'Most top 10 finishes this season',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.top_10,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
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
  },
  {
    key: 'scoring_avg',
    label: 'Scoring Average',
    shortLabel: 'Scoring Avg',
    description: 'Lowest average strokes per round',
    icon: <Gauge className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.scoring_avg,
    format: (v) => v.toFixed(3),
    formatShort: (v) => v.toFixed(2),
    sortOrder: 'asc',
  },
];

export function LeadersTab() {
  const [selectedCategory, setSelectedCategory] = useState(leaderCategories[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollRef = useRef<number>(0);
  
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { rankedOnly: worldRankedPlayers, isLoading: worldRankLoading } = useWorldRankings();

  const isLoading = statsLoading || worldRankLoading;

  // Handle category change with transition
  const handleCategoryChange = (cat: LeaderCategory) => {
    if (cat.key === selectedCategory.key) return;
    scrollRef.current = window.scrollY;
    setIsTransitioning(true);
    setSelectedCategory(cat);
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
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded-full w-24 shrink-0" />
          ))}
        </div>
        {/* Spotlight skeleton */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 h-40 bg-muted rounded-2xl" />
          <div className="col-span-2 space-y-3">
            <div className="h-[76px] bg-muted rounded-xl" />
            <div className="h-[76px] bg-muted rounded-xl" />
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
    <div className="space-y-5">
      {/* Category Chips - refined */}
      <div 
        className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {leaderCategories.map((cat) => {
          const isSelected = selectedCategory.key === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0",
                "active:scale-[0.97]"
              )}
              style={{
                background: isSelected 
                  ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
                  : 'transparent',
                color: isSelected ? '#ffffff' : 'hsl(var(--muted-foreground))',
                border: isSelected 
                  ? 'none' 
                  : '1px solid hsl(var(--border))',
                boxShadow: isSelected 
                  ? '0 2px 8px rgba(30, 41, 59, 0.25)' 
                  : 'none',
              }}
            >
              <span className="opacity-80">{cat.icon}</span>
              <span>{cat.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Content with crossfade transition */}
      <div 
        className={cn(
          "transition-opacity duration-150",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {/* World Rank: Official badge */}
        {selectedCategory.isWorldRank && (
          <div 
            className="flex items-center gap-3 p-3 rounded-xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.15)',
            }}
          >
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              }}
            >
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span 
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(251, 191, 36, 0.2)',
                    color: '#B45309',
                  }}
                >
                  Official
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  World Golf Ranking
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Updated weekly by the Official World Golf Ranking
              </p>
            </div>
          </div>
        )}

        {/* Category description (non-world-rank) */}
        {!selectedCategory.isWorldRank && (
          <p className="text-[13px] text-muted-foreground px-0.5 mb-4">
            {selectedCategory.description}
          </p>
        )}

        {/* Spotlight Top 3 - Podium Style */}
        {top3.length >= 3 ? (
          <div className="grid grid-cols-5 gap-2.5 mb-2">
            {/* #1 - Champion tile (larger, gold accent) */}
            <Link
              to={`/tourhub/player/${top3[0].player_id}`}
              className="col-span-3 rounded-2xl p-4 transition-all active:scale-[0.98] relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(251, 191, 36, 0.14) 0%, rgba(245, 158, 11, 0.06) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                minHeight: '160px',
              }}
            >
              {/* Subtle texture */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              />
              
              <div className="relative flex items-start justify-between mb-4">
                {/* Rank badge */}
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  <span className="text-lg font-bold text-white">
                    {selectedCategory.isWorldRank ? `#${top3[0].value}` : '1'}
                  </span>
                </div>
                
                {/* Avatar */}
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'rgba(100, 116, 139, 0.08)',
                    border: '2px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  {resolvePhotoUrl(top3[0].player?.photo_url) ? (
                    <img 
                      src={resolvePhotoUrl(top3[0].player?.photo_url)!} 
                      alt={top3[0].player?.full_name || ''}
                      className="w-full h-full rounded-full object-cover object-top"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">
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
                  <p className="text-[22px] font-bold text-foreground mt-2">
                    {selectedCategory.format(top3[0].value)}
                  </p>
                )}
              </div>
            </Link>

            {/* #2 and #3 stacked */}
            <div className="col-span-2 flex flex-col gap-2.5">
              {[top3[1], top3[2]].map((player, idx) => {
                const isSecond = idx === 0;
                return (
                  <Link
                    key={player.id}
                    to={`/tourhub/player/${player.player_id}`}
                    className="flex-1 rounded-xl p-3 transition-all active:scale-[0.98]"
                    style={{
                      background: isSecond 
                        ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(100, 116, 139, 0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(180, 83, 9, 0.08) 0%, rgba(146, 64, 14, 0.03) 100%)',
                      border: `1px solid ${isSecond ? 'rgba(148, 163, 184, 0.2)' : 'rgba(180, 83, 9, 0.15)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Rank badge */}
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isSecond
                            ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
                            : 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                        }}
                      >
                        <span className="text-[11px] font-bold text-white">
                          {selectedCategory.isWorldRank ? `#${player.value}` : idx + 2}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {player.player?.full_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {toTitleCase(player.player?.country)}
                        </p>
                      </div>
                      
                      {/* Value (non-world-rank) */}
                      {!selectedCategory.isWorldRank && player.value !== null && (
                        <span className="text-[12px] font-bold text-foreground shrink-0">
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
            <div 
              className="h-px mb-0"
              style={{ background: 'hsl(var(--border) / 0.5)' }}
            />
            
            <div className="space-y-0">
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
          <div 
            className="text-center py-12 rounded-xl"
            style={{ background: 'hsl(var(--muted) / 0.3)' }}
          >
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

// Flat row component - editorial style
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

  return (
    <Link
      to={`/tourhub/player/${player.player_id}`}
      className="flex items-center gap-3 py-3 transition-colors group"
      style={{
        borderBottom: '1px solid hsl(var(--border) / 0.3)',
      }}
    >
      {/* Rank number */}
      <span className="w-6 text-center text-[13px] font-medium text-muted-foreground shrink-0">
        {rank}
      </span>
      
      {/* Avatar */}
      <div 
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'hsl(var(--muted) / 0.5)' }}
      >
        {resolvePhotoUrl(player.player?.photo_url) ? (
          <img 
            src={resolvePhotoUrl(player.player?.photo_url)!} 
            alt={player.player?.full_name || ''}
            className="w-full h-full rounded-full object-cover object-top"
          />
        ) : (
          <span className="text-[11px] font-semibold text-muted-foreground">
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
      
      {/* Value - clean, no labels */}
      <span className="text-[14px] font-semibold text-foreground shrink-0 tabular-nums">
        {displayValue}
      </span>
    </Link>
  );
}
