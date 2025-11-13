import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GolferFilters } from '@/hooks/useActiveGolfers';
import { RADIUS_OPTIONS_KM, GOLFERS_VISIBILITY_FILTERS } from '@/features/golfers/constants';
import clsx from 'clsx';
import '../../hub/pages/nearbyGolfers.css';

type NearbyFilterBarProps = {
  filters: GolferFilters;
  onFiltersChange: (filters: GolferFilters) => void;
};

function VisibilityDropdown({
  value,
  onChange,
}: {
  value: 'all' | 'friends';
  onChange: (v: 'all' | 'friends') => void;
}) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeLabel = GOLFERS_VISIBILITY_FILTERS.find(f => f.value === value)?.label ?? 'All Golfers';

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(v => !v);
  };

  const handleClose = () => setOpen(false);

  return (
    <div className="relative flex-1">
      {/* Trigger (glass button) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
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

      {/* Portal menu with scrim */}
      {open && anchorRect && createPortal(
        <>
          {/* Scrim - blocks interaction with page */}
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.20)',
              backdropFilter: 'none',
              zIndex: 999,
            }}
          />
          {/* Menu surface - solid, no blur */}
          <div
            role="listbox"
            aria-label="Filter golfers"
            aria-modal="true"
            style={{
              position: 'fixed',
              left: anchorRect.left,
              top: anchorRect.bottom + 6,
              minWidth: Math.max(220, anchorRect.width),
              borderRadius: '14px',
              background: 'rgba(32, 37, 41, 0.96)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              zIndex: 1000,
              padding: '4px',
            }}
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
                    handleClose();
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
        </>,
        document.body
      )}
    </div>
  );
}

export function NearbyFilterBar({ filters, onFiltersChange }: NearbyFilterBarProps) {

  return (
    <div>
      {/* Distance chips */}
      <div className="ng-distance-row">
        {RADIUS_OPTIONS_KM.map((option) => (
          <button
            key={option.valueKm}
            onClick={() => onFiltersChange({ ...filters, radiusKm: option.valueKm })}
            className={`ng-chip ${filters.radiusKm === option.valueKm ? 'ng-chip--active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="ng-filter-row">
        <VisibilityDropdown
          value={filters.visibility || 'all'}
          onChange={(v) => onFiltersChange({ ...filters, visibility: v })}
        />

        <button
          onClick={() => onFiltersChange({ ...filters, onlyOpen: !filters.onlyOpen })}
          className={filters.onlyOpen ? 'ng-primary-btn ng-primary-btn--active' : 'ng-select'}
        >
          {filters.onlyOpen ? '✓ Open' : 'Open to Play'}
        </button>
      </div>
    </div>
  );
}
