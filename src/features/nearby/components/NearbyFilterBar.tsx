import React from 'react';
import { GolferFilters } from '@/hooks/useActiveGolfers';
import { RADIUS_OPTIONS_KM } from '@/features/golfers/constants';

type NearbyFilterBarProps = {
  filters: GolferFilters;
  onFiltersChange: (filters: GolferFilters) => void;
};

export function NearbyFilterBar({ filters, onFiltersChange }: NearbyFilterBarProps) {
  const visibilityOptions = [
    { value: 'everyone' as const, label: 'Everyone' },
    { value: 'friends' as const, label: 'Friends' },
    { value: 'all' as const, label: 'All' },
  ];

  return (
    <div className="px-3 space-y-2">
      {/* Distance chips */}
      <div className="flex gap-2">
        {RADIUS_OPTIONS_KM.map((option) => (
          <button
            key={option.valueKm}
            onClick={() => onFiltersChange({ ...filters, radiusKm: option.valueKm })}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.radiusKm === option.valueKm
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Visibility dropdown & Open to Play toggle */}
      <div className="flex gap-2">
        <select
          value={filters.visibility || 'everyone'}
          onChange={(e) => onFiltersChange({ ...filters, visibility: e.target.value as any })}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/90 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {visibilityOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => onFiltersChange({ ...filters, onlyOpen: !filters.onlyOpen })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filters.onlyOpen
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
          }`}
        >
          {filters.onlyOpen ? '✓ Open' : 'Open to Play'}
        </button>
      </div>
    </div>
  );
}
