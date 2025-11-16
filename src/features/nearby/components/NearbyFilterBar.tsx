import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
        className={`w-full h-[34px] px-3 rounded-[10px] border border-white/10 bg-white/[0.06] backdrop-blur-md flex items-center justify-between text-[14px] font-medium transition-all duration-[120ms] focus:outline-none focus:ring-2 focus:ring-white/20 hover:bg-white/[0.10] active:scale-[0.98] ${
          open ? 'rotate-180-chevron' : ''
        }`}
        style={{ color: 'var(--hub-text-body)' }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{activeLabel}</span>
        <svg 
          className={`w-3.5 h-3.5 text-white/60 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Portal menu with scrim */}
      {open && anchorRect && createPortal(
        <>
          {/* Scrim */}
          <div
            onClick={handleClose}
            className="fixed inset-0 z-[998] bg-black/20"
          />
          {/* Menu */}
          <div
            role="listbox"
            aria-label="Filter golfers"
            aria-modal="true"
            className="fixed z-[999] rounded-[14px] bg-[rgba(32,37,41,0.96)] border border-white/6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] py-1 animate-fade-in"
            style={{
              left: anchorRect.left,
              top: anchorRect.bottom + 6,
              minWidth: Math.max(220, anchorRect.width),
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
    <div className="space-y-3">
      {/* Distance chips */}
      <div className="flex gap-2">
        {RADIUS_OPTIONS_KM.map((option) => (
          <button
            key={option.valueKm}
            onClick={() => onFiltersChange({ ...filters, radiusKm: option.valueKm })}
            className={`flex-1 h-[34px] rounded-[10px] text-[14px] font-medium transition-colors ${
              filters.radiusKm === option.valueKm
                ? 'bg-white/20 text-white shadow-[0_0_8px_rgba(0,0,0,0.20)]'
                : 'bg-white/6 text-white/70 hover:bg-white/10'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Visibility dropdown & Open to Play toggle */}
      <div className="flex items-center gap-2">
        <VisibilityDropdown
          value={filters.visibility || 'all'}
          onChange={(v) => onFiltersChange({ ...filters, visibility: v })}
        />

        <button
          onClick={() => onFiltersChange({ ...filters, onlyOpen: !filters.onlyOpen })}
          className={`h-[34px] px-4 rounded-[10px] text-[14px] font-semibold whitespace-nowrap border transition-all duration-[120ms] active:scale-[0.97] ${
            filters.onlyOpen
              ? 'bg-emerald-500/18 border-emerald-400/40 text-emerald-200'
              : 'bg-white/[0.05] border-white/10 text-white/70 hover:bg-white/[0.10]'
          }`}
        >
          {filters.onlyOpen ? '✓ Open' : 'Open to Play'}
        </button>
      </div>
    </div>
  );
}
