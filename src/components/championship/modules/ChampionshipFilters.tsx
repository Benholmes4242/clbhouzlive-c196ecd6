import React from 'react';
import { cn } from '@/lib/utils';
import { PillToggle } from '@/components/ui/PillToggle';
import type { ChampionshipArenaMode, DivisionSlug } from '@/types/championship';
import { useDivisionConfig } from '@/hooks/championship';

interface ChampionshipFiltersProps {
  arenaMode: ChampionshipArenaMode;
  divisionFilter: DivisionSlug | 'all';
  onArenaModeChange: (mode: ChampionshipArenaMode) => void;
  onDivisionFilterChange: (division: DivisionSlug | 'all') => void;
  className?: string;
}

const scopeOptions = [
  { id: 'global', label: 'Global' },
  { id: 'division', label: 'Division' },
  { id: 'friends', label: 'Friends' },
  { id: 'club', label: 'Clubs' },
  { id: 'country', label: 'Country' },
];

/**
 * ChampionshipFilters - Arena mode and division filter controls.
 * Uses Tier 2 pill toggles.
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
    <div className={cn('py-2 space-y-3 w-full', className)}>
      {/* Arena Mode - Pill Toggle */}
      <div className="flex justify-center overflow-x-auto pb-1">
        <PillToggle 
          options={scopeOptions} 
          selected={arenaMode} 
          onSelect={(id) => onArenaModeChange(id as ChampionshipArenaMode)}
          size="small"
        />
      </div>

      {/* Division Filter (only show in division mode) */}
      {arenaMode === 'division' && divisions && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => onDivisionFilterChange('all')}
            className={cn(
              'flex-shrink-0 px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors active:scale-[0.95]',
              divisionFilter === 'all'
                ? 'bg-card text-foreground font-semibold border-border'
                : 'bg-card text-muted-foreground border-border hover:border-border/80'
            )}
          >
            All Divisions
          </button>
          {divisions.map((division) => (
            <button
              key={division.id}
              onClick={() => onDivisionFilterChange(division.slug)}
              className={cn(
                'flex-shrink-0 px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors active:scale-[0.95]',
                divisionFilter === division.slug
                  ? 'text-white border-transparent'
                  : 'bg-card text-muted-foreground border-border hover:border-border/80'
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
