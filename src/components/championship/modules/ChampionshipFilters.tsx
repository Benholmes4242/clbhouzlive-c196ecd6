import React from 'react';
import { cn } from '@/lib/utils';
import type { ChampionshipArenaMode, DivisionSlug } from '@/types/championship';
import { useDivisionConfig } from '@/hooks/championship';

interface ChampionshipFiltersProps {
  arenaMode: ChampionshipArenaMode;
  divisionFilter: DivisionSlug | 'all';
  onArenaModeChange: (mode: ChampionshipArenaMode) => void;
  onDivisionFilterChange: (division: DivisionSlug | 'all') => void;
  className?: string;
}

const ARENA_MODES: { value: ChampionshipArenaMode; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'division', label: 'Division' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Clubs' },
  { value: 'country', label: 'Country' },
];

/**
 * ChampionshipFilters - Arena mode and division filter controls.
 */
export function ChampionshipFilters({
  arenaMode,
  divisionFilter,
  onArenaModeChange,
  onDivisionFilterChange,
  className,
}: ChampionshipFiltersProps) {
  const { data: divisions } = useDivisionConfig();

  return (
    <div className={cn('py-2 space-y-3', className)}>
      {/* Arena Mode Tabs - 44px min height for touch targets */}
      <div className="flex p-1 bg-[#e2e8f0] rounded-xl">
        {ARENA_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onArenaModeChange(mode.value)}
            className={cn(
              'flex-1 py-2.5 px-3 min-h-[44px] text-xs font-medium rounded-lg transition-all flex items-center justify-center',
              arenaMode === mode.value
                ? 'm-0.5 bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Division Filter (only show in division mode) */}
      {arenaMode === 'division' && divisions && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onDivisionFilterChange('all')}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors',
              divisionFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            )}
          >
            All Divisions
          </button>
          {divisions.map((division) => (
            <button
              key={division.id}
              onClick={() => onDivisionFilterChange(division.slug)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors',
                divisionFilter === division.slug
                  ? 'text-white border-transparent'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
              )}
              style={divisionFilter === division.slug ? { backgroundColor: division.color_hex } : undefined}
            >
              {division.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
