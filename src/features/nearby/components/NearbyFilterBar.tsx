import React, { useState, useRef, useEffect } from 'react';
import { GolferFilters } from '@/hooks/useActiveGolfers';
import { RADIUS_OPTIONS_KM, GOLFERS_VISIBILITY_FILTERS } from '@/features/golfers/constants';
import clsx from 'clsx';

type NearbyFilterBarProps = {
  filters: GolferFilters;
  onFiltersChange: (filters: GolferFilters) => void;
};

function useOutsideClose(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose, ref]);
}

function VisibilityDropdown({
  value,
  onChange,
}: {
  value: 'all' | 'friends';
  onChange: (v: 'all' | 'friends') => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, () => setOpen(false));

  const activeLabel = GOLFERS_VISIBILITY_FILTERS.find(f => f.value === value)?.label ?? 'All Golfers';

  return (
    <div ref={ref} className="relative flex-1">
      {/* Trigger (glass button) */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full rounded-lg text-sm font-medium bg-white/5 text-white/90 border border-white/10 backdrop-blur-md transition focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center justify-between gap-2"
        style={{
          height: '34px',
          padding: '8px 12px',
          fontSize: '14px',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {activeLabel}
        <span className="pointer-events-none text-white/60 text-xs">▾</span>
      </button>

      {/* Popover list */}
      <div
        role="listbox"
        aria-label="Filter golfers"
        className={clsx(
          "absolute left-0 mt-2 w-full p-1 rounded-xl z-50",
          "bg-white/10 border border-white/15 backdrop-blur-xl",
          "shadow-lg shadow-black/40",
          "transition-all duration-150 origin-top",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {GOLFERS_VISIBILITY_FILTERS.map(opt => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={clsx(
                "w-full text-left px-3 py-2.5 rounded-lg",
                "text-sm transition",
                selected
                  ? "bg-white/18 text-white font-medium"
                  : "text-white/85 hover:bg-white/10"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NearbyFilterBar({ filters, onFiltersChange }: NearbyFilterBarProps) {

  return (
    <div className="px-4 space-y-3">
      {/* Distance chips */}
      <div className="flex gap-2">
        {RADIUS_OPTIONS_KM.map((option) => (
          <button
            key={option.valueKm}
            onClick={() => onFiltersChange({ ...filters, radiusKm: option.valueKm })}
            className={`flex-1 rounded-lg text-sm font-medium transition-colors ${
              filters.radiusKm === option.valueKm
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
            style={{
              height: '34px',
              padding: '8px 12px',
              fontSize: '14px',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Visibility dropdown & Open to Play toggle */}
      <div className="flex gap-2">
        <VisibilityDropdown
          value={filters.visibility || 'all'}
          onChange={(v) => onFiltersChange({ ...filters, visibility: v })}
        />

        <button
          onClick={() => onFiltersChange({ ...filters, onlyOpen: !filters.onlyOpen })}
          className={`rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filters.onlyOpen
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
          }`}
          style={{
            height: '34px',
            padding: '8px 16px',
            fontSize: '14px',
          }}
        >
          {filters.onlyOpen ? '✓ Open' : 'Open to Play'}
        </button>
      </div>
    </div>
  );
}
