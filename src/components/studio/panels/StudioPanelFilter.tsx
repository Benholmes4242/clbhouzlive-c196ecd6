import { useState, useCallback, useRef, memo } from 'react';
import { StudioEdits, FilterId } from '@/types/studio';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';

type StudioPanelFilterProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
  previewUrl?: string | null;
};

// Ordered for UX: mirrors course conditions
const FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: 'normal', label: 'Pure' },
  { id: 'vivid', label: 'Fresh Cut' },
  { id: 'cool', label: 'Early Tee' },
  { id: 'warm', label: 'Late Round' },
  { id: 'pop', label: 'Sharp' },
  { id: 'matte', label: 'Overcast' },
  { id: 'fade', label: 'Mist' },
  { id: 'vintage', label: 'Heritage' },
  { id: 'dramatic', label: 'Depth' },
  { id: 'bw', label: 'Classic' },
];

// Memoized filter card with hold-to-compare support
const FilterCard = memo(function FilterCard({
  filter,
  isSelected,
  onSelect,
  previewUrl,
}: {
  filter: { id: FilterId; label: string };
  isSelected: boolean;
  onSelect: (id: FilterId) => void;
  previewUrl?: string | null;
}) {
  const [isComparing, setIsComparing] = useState(false);
  const timerRef = useRef<number>();

  const handlePointerDown = () => {
    timerRef.current = window.setTimeout(() => setIsComparing(true), 300);
  };

  const handlePointerUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsComparing(false);
  };

  return (
    <button
      onClick={() => onSelect(filter.id)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "rounded-xl overflow-hidden transition-all duration-150 box-border active:scale-[0.98] snap-start",
        isSelected
          ? 'ring-2 ring-primary shadow-[inset_0_0_0_2px_rgba(63,63,70,0.3)]'
          : 'shadow-[inset_0_0_0_1px_rgba(228,228,231,0.9)] hover:shadow-[inset_0_0_0_1px_rgba(212,212,216,1)]'
      )}
    >
      {/* Preview tile with filter applied */}
      <div className="aspect-square relative bg-muted">
        {previewUrl ? (
          <div className={cn(
            "w-full h-full transition-all duration-150",
            // When comparing (long-press), remove filter to show original
            isComparing ? '' : getFilterClass(filter.id)
          )}>
            <img 
              src={previewUrl} 
              alt={filter.label}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div 
            className={cn(
              "w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600",
              isComparing ? '' : getFilterClass(filter.id)
            )}
          />
        )}
        
        {/* Selected checkmark */}
        <div className={cn(
          "absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm transition-all duration-150",
          isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        )}>
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Comparing indicator */}
        {isComparing && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
            Original
          </div>
        )}
      </div>
      
      {/* Label */}
      <div className={cn(
        "py-1.5 px-1 text-center transition-colors duration-150",
        isSelected ? 'bg-primary' : 'bg-card'
      )}>
        <span className={cn(
          "text-[11px] font-medium block truncate",
          isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
        )}>
          {filter.label}
        </span>
      </div>
    </button>
  );
});

export default function StudioPanelFilter({ 
  edits, 
  updateEdits, 
  previewUrl 
}: StudioPanelFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterId>(edits?.filter || 'normal');
  const [intensity, setIntensity] = useState(edits?.filterIntensity ?? 100);

  // Instant UI update - optimistic selection
  const handleSelectFilter = useCallback((filterId: FilterId) => {
    setSelectedFilter(filterId);
    setIntensity(100); // Reset intensity on new filter selection
    requestAnimationFrame(() => {
      updateEdits({ filter: filterId, filterIntensity: 100 });
    });
  }, [updateEdits]);

  const handleIntensityChange = useCallback((value: number) => {
    setIntensity(value);
    updateEdits({ filterIntensity: value });
  }, [updateEdits]);

  const selectedLabel = FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label || 'Pure';
  const showIntensity = selectedFilter !== 'normal';

  return (
    <div className="flex flex-col h-full">
      {/* Compact header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground">Filters</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Selected: {selectedLabel}
          </span>
          <span className="text-[9px] text-muted-foreground/50">Hold to compare</span>
        </div>
      </div>
      
      {/* 3-column grid with scroll snap */}
      <div 
        className="flex-1 overflow-y-auto px-4 pt-2 pb-4"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        <div className="grid grid-cols-3 gap-3">
          {FILTER_OPTIONS.map(filter => (
            <FilterCard
              key={filter.id}
              filter={filter}
              isSelected={selectedFilter === filter.id}
              onSelect={handleSelectFilter}
              previewUrl={previewUrl}
            />
          ))}
        </div>
      </div>

      {/* Intensity slider — appears for non-Pure filters */}
      {showIntensity && (
        <div className="px-4 py-3 border-t border-border/40 bg-card">
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-medium text-muted-foreground shrink-0">Intensity</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={intensity}
              onChange={(e) => handleIntensityChange(Number(e.target.value))}
              className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-md"
            />
            <span className="text-[11px] text-muted-foreground font-mono w-8 text-right">{intensity}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
