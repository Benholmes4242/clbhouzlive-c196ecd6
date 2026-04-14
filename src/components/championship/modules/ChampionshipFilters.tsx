import React, { useRef, useEffect } from 'react';
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

const arenaOptions = [
  { id: 'global', label: '🌍 Global' },
  { id: 'division', label: '⚡ Division' },
  { id: 'friends', label: '👥 Friends' },
];

/**
 * ChampionshipFilters - Arena mode and division filter controls.
 * Augusta green active state.
 */
export function ChampionshipFilters({
  arenaMode,
  divisionFilter,
  onArenaModeChange,
  onDivisionFilterChange,
  className,
}: ChampionshipFiltersProps) {
  const { data: divisions } = useDivisionConfig();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, []);

  return (
    <div className={cn('py-2 space-y-3 w-full', className)}>
      {/* Arena Mode - Inline buttons with green active */}
      <div
        ref={scrollRef}
        className="flex"
        style={{
          background: 'rgba(15,23,42,0.05)',
          borderRadius: 12,
          padding: 3,
        }}
      >
        {arenaOptions.map((t) => (
          <button
            key={t.id}
            onClick={() => onArenaModeChange(t.id as ChampionshipArenaMode)}
            className="active:scale-[0.97] transition-all"
            style={{
              flex: 1,
              padding: 'clamp(7px,2vw,9px) 4px',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              fontSize: 'clamp(11px,3vw,13px)',
              fontWeight: arenaMode === t.id ? 800 : 500,
              fontFamily: 'DM Sans,system-ui,sans-serif',
              background: arenaMode === t.id ? '#FFFFFF' : 'none',
              color: arenaMode === t.id ? '#006747' : '#6B7280',
              boxShadow: arenaMode === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Division Filter (only show in division mode) */}
      {arenaMode === 'division' && divisions && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => onDivisionFilterChange('all')}
            className={cn(
              'flex-shrink-0 px-3.5 py-2 text-xs font-medium rounded-xl transition-colors active:scale-[0.95]',
              divisionFilter === 'all'
                ? 'text-[#0F172A] font-semibold'
                : 'text-[#64748B]'
            )}
            style={divisionFilter === 'all'
              ? { background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)' }
              : { background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)' }
            }
          >
            All Divisions
          </button>
          {divisions.map((division) => (
            <button
              key={division.id}
              onClick={() => onDivisionFilterChange(division.slug)}
              className={cn(
                'flex-shrink-0 px-3.5 py-2 text-xs font-medium rounded-xl transition-colors active:scale-[0.95]',
                divisionFilter === division.slug
                  ? 'text-white'
                  : 'text-[#64748B]'
              )}
              style={divisionFilter === division.slug
                ? { backgroundColor: division.color_hex, border: 'none' }
                : { background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)' }
              }
            >
              {division.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
