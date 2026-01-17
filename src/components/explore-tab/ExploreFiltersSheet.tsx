/**
 * ExploreFiltersSheet - Bottom sheet for filtering Explore content
 * 
 * Redesigned with polished styling:
 * - Custom slide-up animation
 * - Handle bar and close button
 * - Grid layout for region options
 * - Selected state with check icons
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

// Time filter chip
const TimeChip: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    aria-selected={selected}
    className={cn(
      "px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]",
      selected
        ? "bg-gray-900 text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    )}
  >
    {label}
  </button>
);

// Region grid item with emoji and check
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
        ? "bg-gray-900 text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    )}
  >
    <span className="flex items-center gap-2">
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
    {selected && <Check className="w-4 h-4" />}
  </button>
);

// Sort option with check
const SortItem: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    aria-selected={selected}
    className={cn(
      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] flex-1",
      selected
        ? "bg-gray-900 text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    )}
  >
    <span>{label}</span>
    {selected && <Check className="w-4 h-4" />}
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

  // Sync local state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setIsAnimating(true);
    }
  }, [isOpen, filters]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleReset = useCallback(() => {
    const defaults: ExploreFilters = {
      timeFrame: 'all',
      region: 'all',
      sort: 'recent',
    };
    setLocalFilters(defaults);
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

      {/* Sheet container */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div 
          className={cn(
            "bg-white rounded-t-[32px] shadow-2xl",
            isAnimating && "animate-in slide-in-from-bottom duration-300"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-sheet-title"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-5 border-b border-gray-100">
            <h2 id="filter-sheet-title" className="text-xl font-semibold text-gray-900">
              Filters
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Time Frame */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
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

            {/* Region - grid layout */}
            {showRegionFilter && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
                      fullWidth={index === 0} // "All regions" spans full width
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Sort by
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

          {/* Action buttons */}
          <div 
            className="flex gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50"
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className={cn(
                "flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all",
                "bg-white border border-gray-200 text-gray-700",
                "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className={cn(
                "flex-[2] py-3.5 rounded-2xl text-sm font-semibold transition-all",
                "bg-gray-900 text-white shadow-lg shadow-gray-900/20",
                "hover:bg-gray-800 active:scale-[0.98]"
              )}
            >
              Apply filters
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

// Helper to get date cutoff for time filter
export const getTimeFilterDate = (timeFrame: TimeFilter): Date | null => {
  const now = new Date();
  switch (timeFrame) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null; // All time
  }
};

export default ExploreFiltersSheet;
