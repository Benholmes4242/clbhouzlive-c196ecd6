/**
 * ExploreFiltersSheet - Bottom sheet for filtering Explore content
 * 
 * Filters:
 * - Time Frame: All time (default), This year, This month, This week
 * - Region: All regions (default), GB & Ireland, Europe, USA, Rest of World
 * - Sort: Most recent (default), Most liked
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RegionKey, ExploreFilters, TimeFilter, SortFilter } from '@/hooks/useExploreMoments';

export type RegionFilter = 'all' | RegionKey;

interface ExploreFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ExploreFilters;
  onApply: (filters: ExploreFilters) => void;
  showRegionFilter?: boolean; // Hide on region pages since already filtered
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'year', label: 'This year' },
  { value: 'month', label: 'This month' },
  { value: 'week', label: 'This week' },
];

const REGION_OPTIONS: { value: RegionFilter; label: string }[] = [
  { value: 'all', label: 'All regions' },
  { value: 'GBI', label: '🇬🇧 GB & Ireland' },
  { value: 'EU', label: '🇪🇺 Europe' },
  { value: 'USA', label: '🇺🇸 USA' },
  { value: 'ROW', label: '🌍 Rest of World' },
];

const SORT_OPTIONS: { value: SortFilter; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'liked', label: 'Most liked' },
];

const FilterPill: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
      selected
        ? "bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b]"
        : "bg-transparent border border-transparent text-[#64748b] hover:bg-[#f8fafc]"
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

  // Sync local state when sheet opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleReset = () => {
    const defaults: ExploreFilters = {
      timeFrame: 'all',
      region: 'all',
      sort: 'recent',
    };
    setLocalFilters(defaults);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const hasChanges = 
    localFilters.timeFrame !== 'all' ||
    localFilters.region !== 'all' ||
    localFilters.sort !== 'recent';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
        <SheetHeader className="pb-4">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-4">
          {/* Time Frame */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Time Frame</h3>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map(option => (
                <FilterPill
                  key={option.value}
                  label={option.label}
                  selected={localFilters.timeFrame === option.value}
                  onClick={() => setLocalFilters(f => ({ ...f, timeFrame: option.value }))}
                />
              ))}
            </div>
          </div>

          {/* Region - only show if not already on a region page */}
          {showRegionFilter && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Region</h3>
              <div className="flex flex-wrap gap-2">
                {REGION_OPTIONS.map(option => (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    selected={localFilters.region === option.value}
                    onClick={() => setLocalFilters(f => ({ ...f, region: option.value }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Sort by</h3>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(option => (
                <FilterPill
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
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleReset}
            disabled={!hasChanges && localFilters.timeFrame === 'all'}
          >
            Reset
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
