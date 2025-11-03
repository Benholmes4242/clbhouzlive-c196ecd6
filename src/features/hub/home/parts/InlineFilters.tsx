/**
 * Inline Filters Component
 * Chip-based filters for games and other content
 */

import React from 'react';

export type GamesFilters = {
  when?: 'now' | 'today' | 'week' | 'all';
  distance?: '5' | '10' | '25' | 'any';
  sort?: 'soonest' | 'closest' | 'newest';
};

interface InlineFiltersProps {
  value: GamesFilters;
  onChange: (v: GamesFilters) => void;
}

export function InlineFilters({ value, onChange }: InlineFiltersProps) {
  const set = (k: keyof GamesFilters, v: any) => onChange({ ...value, [k]: v });
  
  return (
    <div className="chips" role="toolbar" aria-label="Game filters">
      <button 
        className="chip" 
        aria-pressed={value.when === 'today'} 
        onClick={() => set('when', value.when === 'today' ? 'all' : 'today')}
      >
        When
      </button>
      <button 
        className="chip" 
        aria-pressed={value.distance === '10'} 
        onClick={() => set('distance', value.distance === '10' ? 'any' : '10')}
      >
        Distance
      </button>
      <button 
        className="chip" 
        aria-pressed={value.sort === 'soonest'} 
        onClick={() => set('sort', value.sort === 'soonest' ? 'newest' : 'soonest')}
      >
        Sort
      </button>
    </div>
  );
}
