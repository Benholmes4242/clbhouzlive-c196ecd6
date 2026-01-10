/**
 * LeadersTab - Premium Leaders Page with Spotlight Top 3 and Flat Rows
 * 
 * Features:
 * - Category chips with group/subgroup organization
 * - Spotlight block for Top 3 (cinematic, headline-driven)
 * - Flat editorial rows on page background (no card containers)
 * - Proper world rank ordering (valid ranks first, 0/null at bottom)
 * - Title Case countries, clean numeric values
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, Gauge, Award, TrendingUp, DollarSign, Globe } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings, toTitleCase, getInitials } from '../../hooks/useWorldRankings';
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
    icon: <Trophy className="w-4 h-4" />,
    getValue: (s) => s.raw_data?.statistics?.world_rank,
    format: (v) => `#${v}`,
    formatShort: (v) => `#${v}`,
    sortOrder: 'asc',
    isWorldRank: true,
  },
  {
    key: 'events_played',
    label: 'Events Played',
    shortLabel: 'Events',
    description: 'Most tournament appearances this season',
    icon: <Award className="w-4 h-4" />,
    getValue: (s) => s.events_played,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
  },
  {
    key: 'cuts_made',
    label: 'Cuts Made',
    shortLabel: 'Cuts',
    description: 'Most weekends made this season',
    icon: <Target className="w-4 h-4" />,
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
    icon: <TrendingUp className="w-4 h-4" />,
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
    icon: <DollarSign className="w-4 h-4" />,
    getValue: (s) => s.raw_data?.statistics?.earnings,
    format: (v) => `$${(v / 1_000_000).toFixed(2)}M`,
    formatShort: (v) => `$${(v / 1_000_000).toFixed(1)}M`,
    sortOrder: 'desc',
  },
  {
    key: 'scoring_avg',
    label: 'Scoring Average',
    shortLabel: 'Scoring',
    description: 'Lowest average strokes per round',
    icon: <Gauge className="w-4 h-4" />,
    getValue: (s) => s.raw_data?.statistics?.scoring_avg,
    format: (v) => v.toFixed(3),
    formatShort: (v) => v.toFixed(2),
    sortOrder: 'asc',
  },
];

export function LeadersTab() {
  const [selectedCategory, setSelectedCategory] = useState(leaderCategories[0]);
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { rankedOnly: worldRankedPlayers, isLoading: worldRankLoading } = useWorldRankings();

  const isLoading = statsLoading || worldRankLoading;

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
        // For ascending sorts (lower is better), exclude null/undefined
        // For world rank specifically, exclude 0 and null
        if (selectedCategory.key === 'world_rank') {
          return value !== null && value !== undefined && value > 0 && s.player;
        }
        return value !== null && value !== undefined && s.player;
      })
      .sort((a, b) => {
        const aVal = selectedCategory.getValue(a) || 0;
        const bVal = selectedCategory.getValue(b) || 0;
        
        // For world rank: valid ranks first (>=1), then by rank ascending
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 bg-muted rounded-full w-24 shrink-0" />
          ))}
        </div>
        {/* Spotlight skeleton */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 h-36 bg-muted rounded-2xl" />
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        </div>
        {/* List skeleton */}
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted/30 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category Chips */}
      <div 
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {leaderCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all shrink-0",
              "active:scale-[0.97]"
            )}
            style={{
              background: selectedCategory.key === cat.key 
                ? '#1e293b' 
                : 'rgba(255, 255, 255, 0.8)',
              color: selectedCategory.key === cat.key 
                ? '#ffffff' 
                : '#475569',
              border: `1px solid ${selectedCategory.key === cat.key ? '#1e293b' : 'rgba(0, 0, 0, 0.06)'}`,
              boxShadow: selectedCategory.key === cat.key 
                ? '0 2px 8px rgba(0, 0, 0, 0.12)' 
                : '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            <span className={cn(
              "transition-colors",
              selectedCategory.key === cat.key ? 'opacity-100' : 'opacity-60'
            )}>
              {cat.icon}
            </span>
            <span>{cat.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* World Rank: Official badge + description */}
      {selectedCategory.isWorldRank && (
        <div 
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            }}
          >
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  color: '#B45309',
                }}
              >
                Official
              </span>
              <span 
                className="text-[13px] font-semibold"
                style={{ color: '#1e293b' }}
              >
                World Golf Ranking
              </span>
            </div>
            <p 
              className="text-[11px] mt-0.5"
              style={{ color: '#78716C' }}
            >
              Updated weekly by the Official World Golf Ranking
            </p>
          </div>
        </div>
      )}

      {/* Category description (non-world-rank) */}
      {!selectedCategory.isWorldRank && (
        <p 
          className="text-[13px] px-1"
          style={{ color: '#64748B' }}
        >
          {selectedCategory.description}
        </p>
      )}

      {/* Spotlight Top 3 */}
      {top3.length >= 3 ? (
        <div className="grid grid-cols-5 gap-2.5">
          {/* #1 - Large tile (3 cols) */}
          <Link
            to={`/tourhub/player/${top3[0].player_id}`}
            className="col-span-3 rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                }}
              >
                <span className="text-xl font-bold text-white">
                  {selectedCategory.isWorldRank ? `#${top3[0].value}` : '1'}
                </span>
              </div>
              {/* Avatar placeholder */}
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(100, 116, 139, 0.1)' }}
              >
                {top3[0].player?.photo_url ? (
                  <img 
                    src={top3[0].player.photo_url} 
                    alt={top3[0].player.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span 
                    className="text-lg font-semibold"
                    style={{ color: '#64748B' }}
                  >
                    {getInitials(top3[0].player?.full_name || '')}
                  </span>
                )}
              </div>
            </div>
            <p 
              className="text-[16px] font-semibold truncate"
              style={{ color: '#1e293b' }}
            >
              {top3[0].player?.full_name}
            </p>
            <p 
              className="text-[13px] truncate"
              style={{ color: '#64748B' }}
            >
              {toTitleCase(top3[0].player?.country)}
            </p>
            {!selectedCategory.isWorldRank && top3[0].value !== null && (
              <p 
                className="text-[20px] font-bold mt-2"
                style={{ color: '#1e293b' }}
              >
                {selectedCategory.format(top3[0].value)}
              </p>
            )}
          </Link>

          {/* #2 and #3 stacked (2 cols) */}
          <div className="col-span-2 flex flex-col gap-2.5">
            {[top3[1], top3[2]].map((player, idx) => (
              <Link
                key={player.id}
                to={`/tourhub/player/${player.player_id}`}
                className="flex-1 rounded-xl p-3 transition-all active:scale-[0.98]"
                style={{
                  background: idx === 0 
                    ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(100, 116, 139, 0.06) 100%)'
                    : 'linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(180, 83, 9, 0.05) 100%)',
                  border: `1px solid ${idx === 0 ? 'rgba(148, 163, 184, 0.25)' : 'rgba(217, 119, 6, 0.2)'}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Rank badge */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: idx === 0
                        ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
                        : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <span className="text-sm font-bold text-white">
                      {selectedCategory.isWorldRank ? `#${player.value}` : idx + 2}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-[13px] font-semibold truncate"
                      style={{ color: '#1e293b' }}
                    >
                      {player.player?.full_name}
                    </p>
                    <p 
                      className="text-[11px] truncate"
                      style={{ color: '#64748B' }}
                    >
                      {toTitleCase(player.player?.country)}
                    </p>
                  </div>
                  {/* Value (non-world-rank) */}
                  {!selectedCategory.isWorldRank && player.value !== null && (
                    <span 
                      className="text-[13px] font-bold shrink-0"
                      style={{ color: '#1e293b' }}
                    >
                      {selectedCategory.formatShort(player.value)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : top3.length > 0 ? (
        // Fallback for less than 3 players
        <div className="space-y-2">
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

      {/* Rest of list - flat rows */}
      {restOfList.length > 0 ? (
        <div className="pt-2">
          <div 
            className="h-px mb-3"
            style={{ background: 'rgba(0, 0, 0, 0.06)' }}
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
          style={{ background: 'rgba(0, 0, 0, 0.03)' }}
        >
          <p 
            className="text-[14px]"
            style={{ color: '#64748B' }}
          >
            No data available for this category yet.
          </p>
        </div>
      ) : null}

      {/* Info Note */}
      <div 
        className="text-center pt-4 space-y-1"
        style={{ color: '#94a3b8' }}
      >
        <p className="text-[11px]">
          Season leaders computed from available tournament data
        </p>
        <p className="text-[11px]">
          Live standings will be available with full data feeds
        </p>
      </div>
    </div>
  );
}

// Flat row component for the ranked list
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
      className="flex items-center gap-3 py-3 px-1 transition-colors group"
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Rank number */}
      <span 
        className="w-6 text-center text-[13px] font-medium shrink-0"
        style={{ color: '#94a3b8' }}
      >
        {rank}
      </span>
      
      {/* Avatar */}
      <div 
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(100, 116, 139, 0.08)' }}
      >
        {player.player?.photo_url ? (
          <img 
            src={player.player.photo_url} 
            alt={player.player.full_name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span 
            className="text-[11px] font-semibold"
            style={{ color: '#64748B' }}
          >
            {getInitials(player.player?.full_name || '')}
          </span>
        )}
      </div>
      
      {/* Name + country */}
      <div className="flex-1 min-w-0">
        <p 
          className="text-[14px] font-medium truncate transition-colors group-hover:text-primary"
          style={{ color: '#1e293b' }}
        >
          {player.player?.full_name}
        </p>
        <p 
          className="text-[12px] truncate"
          style={{ color: '#94a3b8' }}
        >
          {toTitleCase(player.player?.country)}
        </p>
      </div>
      
      {/* Value */}
      <span 
        className="text-[14px] font-semibold shrink-0"
        style={{ color: '#1e293b' }}
      >
        {displayValue}
      </span>
    </Link>
  );
}
