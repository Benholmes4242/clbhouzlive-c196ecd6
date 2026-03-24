import React from 'react';
import { cn } from '@/lib/utils';
import type { ChampionshipArenaMode } from '@/types/championship';

interface ArenaPill {
  id: ChampionshipArenaMode;
  icon: string;
  rank: number | null;
  label: string;
  total: number;
  color: string;
}

interface ArenasStripProps {
  activeArena: ChampionshipArenaMode;
  onArenaChange: (arena: ChampionshipArenaMode) => void;
  globalRank: number | null;
  globalTotal: number;
  countryRank: number | null;
  countryLabel: string;
  countryFlag: string;
  countryTotal: number;
  clubRank: number | null;
  clubLabel: string;
  clubTotal: number;
  handicapRank: number | null;
  handicapLabel: string;
  handicapTotal: number;
  seasonLabel?: string;
}

const ARENA_COLORS = {
  global: '#6366F1',
  country: '#E63946',
  club: '#006747',
  handicap: '#F59E0B',
};

const getRankSuffix = (rank: number): string => {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export const ArenasStrip: React.FC<ArenasStripProps> = ({
  activeArena,
  onArenaChange,
  globalRank,
  globalTotal,
  countryRank,
  countryLabel,
  countryFlag,
  countryTotal,
  clubRank,
  clubLabel,
  clubTotal,
  handicapRank,
  handicapLabel,
  handicapTotal,
  seasonLabel,
}) => {
  const pills: ArenaPill[] = [
    { id: 'global', icon: '🌍', rank: globalRank, label: 'Global', total: globalTotal, color: ARENA_COLORS.global },
    { id: 'country', icon: countryFlag || '🏳️', rank: countryRank, label: countryLabel || 'Country', total: countryTotal, color: ARENA_COLORS.country },
    { id: 'club', icon: '⛳', rank: clubRank, label: clubLabel || 'My Club', total: clubTotal, color: ARENA_COLORS.club },
    { id: 'handicap', icon: '🎯', rank: handicapRank, label: handicapLabel || 'Handicap', total: handicapTotal, color: ARENA_COLORS.handicap },
  ];

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: '#F5A623' }}>
        Your Rankings{seasonLabel ? ` · ${seasonLabel}` : ''}
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {pills.map((pill) => {
          const isActive = activeArena === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => onArenaChange(pill.id)}
              className="flex-shrink-0 flex flex-col items-center transition-all active:scale-[0.96]"
              style={{
                minWidth: 80,
                borderRadius: 14,
                padding: '10px 14px',
                backgroundColor: isActive ? `${pill.color}15` : 'hsl(var(--card))',
                border: isActive
                  ? `1.5px solid ${pill.color}88`
                  : '1.5px solid hsl(var(--border))',
                boxShadow: isActive ? `0 0 12px ${pill.color}25` : 'none',
              }}
            >
              <span className="text-base mb-1">{pill.icon}</span>
              <span
                className="text-[22px] font-black leading-none"
                style={{ color: isActive ? pill.color : 'hsl(var(--foreground))' }}
              >
                {pill.rank !== null ? `${pill.rank}${getRankSuffix(pill.rank)}` : '—'}
              </span>
              <span className="text-[11px] font-semibold text-foreground mt-0.5 truncate max-w-[72px]">
                {pill.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {pill.total > 0 ? `${pill.total.toLocaleString()} players` : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
