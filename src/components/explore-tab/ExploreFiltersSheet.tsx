/**
 * ExploreFiltersSheet - Premium bottom sheet for filtering Explore content
 * A* Polish: rounded-t-3xl, refined pills, emerald Apply button
 */

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Check } from 'lucide-react';
import { RegionKey, ExploreFilters, TimeFilter, SortFilter } from '@/hooks/useExploreMoments';

export type RegionFilter = 'all' | RegionKey;

interface ExploreFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ExploreFilters;
  onApply: (filters: ExploreFilters) => void;
  showRegionFilter?: boolean;
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'year', label: 'This year' },
  { value: 'month', label: 'This month' },
  { value: 'week', label: 'This week' },
];

const REGION_OPTIONS: { value: RegionFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All regions', emoji: '🌐' },
  { value: 'GBI', label: 'GB & Ireland', emoji: '🇬🇧' },
  { value: 'EU', label: 'Europe', emoji: '🇪🇺' },
  { value: 'USA', label: 'USA', emoji: '🇺🇸' },
  { value: 'ROW', label: 'Rest of World', emoji: '🌍' },
];

const SORT_OPTIONS: { value: SortFilter; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'liked', label: 'Most liked' },
];

// Time filter pill
const TimeChip: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    aria-selected={selected}
    className={cn(
      "px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px]",
      selected
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-600"
    )}
  >
    {label}
  </button>
);

// Region item
const RegionItem: React.FC<{
  label: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}> = ({ label, emoji, selected, onClick, fullWidth }) => (
  <button
    onClick={onClick}
    aria-selected={selected}
    className={cn(
      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]",
      fullWidth && "col-span-2",
      selected
        ? "bg-gray-900 text-white"
        : "bg-gray-50 text-gray-600"
    )}
  >
    <span className="flex items-center gap-2">
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
    {selected && <Check className="w-4 h-4" />}
  </button>
);

// Sort pill
const SortItem: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    aria-selected={selected}
    className={cn(
      "px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] flex-1",
      selected
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-600"
    )}
  >
    {label}
  </button>
);

export const ExploreFiltersSheet: React.FC<ExploreFiltersSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  showRegionFilter = true,
}) => {
  const [localFilters, setLocalFilters] = React.useState<ExploreFilters>(filters);
  const [isAnimating, setIsAnimating] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setIsAnimating(true);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleReset = useCallback(() => {
    setLocalFilters({ timeFrame: 'all', region: 'all', sort: 'recent' });
  }, []);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const hasChanges = 
    localFilters.timeFrame !== 'all' ||
    localFilters.region !== 'all' ||
    localFilters.sort !== 'recent';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div 
          className={cn(
            "bg-white rounded-t-3xl shadow-2xl",
            isAnimating && "animate-in slide-in-from-bottom duration-300"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-sheet-title"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 id="filter-sheet-title" className="text-lg font-semibold text-gray-900">
              Filters
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Time Frame */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Time Frame
              </h3>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map(option => (
                  <TimeChip
                    key={option.value}
                    label={option.label}
                    selected={localFilters.timeFrame === option.value}
                    onClick={() => setLocalFilters(f => ({ ...f, timeFrame: option.value }))}
                  />
                ))}
              </div>
            </div>

            {/* Region */}
            {showRegionFilter && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Region
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {REGION_OPTIONS.map((option, index) => (
                    <RegionItem
                      key={option.value}
                      label={option.label}
                      emoji={option.emoji}
                      selected={localFilters.region === option.value}
                      onClick={() => setLocalFilters(f => ({ ...f, region: option.value }))}
                      fullWidth={index === 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Sort By
              </h3>
              <div className="flex gap-2">
                {SORT_OPTIONS.map(option => (
                  <SortItem
                    key={option.value}
                    label={option.label}
                    selected={localFilters.sort === option.value}
                    onClick={() => setLocalFilters(f => ({ ...f, sort: option.value }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div 
            className="flex items-center gap-4 px-5 py-4 border-t border-gray-100"
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="text-sm font-medium text-gray-400 disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-3 rounded-full bg-emerald-600 text-white font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper to count active filters
export const countActiveFilters = (filters: ExploreFilters, showRegion = true): number => {
  let count = 0;
  if (filters.timeFrame !== 'all') count++;
  if (showRegion && filters.region !== 'all') count++;
  if (filters.sort !== 'recent') count++;
  return count;
};

export const getTimeFilterDate = (timeFrame: TimeFilter): Date | null => {
  const now = new Date();
  switch (timeFrame) {
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year': return new Date(now.getFullYear(), 0, 1);
    default: return null;
  }
};

export default ExploreFiltersSheet;
