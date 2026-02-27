import { useState, useCallback, useRef, memo } from 'react';
import { StudioEdits, FilterId } from '@/types/studio';
import { getFilterClass } from '@/utils/studioFilters';

type StudioPanelFilterProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
  previewUrl?: string | null;
  onCompareStart?: () => void;
  onCompareEnd?: () => void;
};

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

const FilterCard = memo(function FilterCard({
  filter,
  isSelected,
  onSelect,
  previewUrl,
  onCompareStart,
  onCompareEnd,
}: {
  filter: { id: FilterId; label: string };
  isSelected: boolean;
  onSelect: (id: FilterId) => void;
  previewUrl?: string | null;
  onCompareStart?: () => void;
  onCompareEnd?: () => void;
}) {
  const [isComparing, setIsComparing] = useState(false);
  const timerRef = useRef<number>();

  const handlePointerDown = () => {
    timerRef.current = window.setTimeout(() => {
      setIsComparing(true);
      onCompareStart?.();
    }, 300);
  };

  const handlePointerUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isComparing) {
      setIsComparing(false);
      onCompareEnd?.();
    }
  };

  return (
    <button
      onClick={() => onSelect(filter.id)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="rounded-xl overflow-hidden transition-all duration-150 active:scale-[0.98] snap-start"
      style={{
        border: isSelected ? '2.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: isSelected ? '0 0 0 1px rgba(245,158,11,0.3)' : undefined,
      }}
    >
      <div className="aspect-square relative" style={{ background: '#2A2A2A' }}>
        {previewUrl ? (
          <div className={`w-full h-full transition-all duration-150 ${isComparing ? '' : getFilterClass(filter.id)}`}>
            <img 
              src={previewUrl} 
              alt={filter.label}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 ${isComparing ? '' : getFilterClass(filter.id)}`} />
        )}
        
        {/* Selected checkmark — amber circle */}
        <div
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all duration-150"
          style={{
            background: '#f59e0b',
            opacity: isSelected ? 1 : 0,
            transform: isSelected ? 'scale(1)' : 'scale(0.75)',
          }}
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {isComparing && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-white text-[9px] font-medium" style={{ background: 'rgba(0,0,0,0.6)' }}>
            Original
          </div>
        )}
      </div>
      
      <div className="py-1.5 px-1 text-center" style={{ background: '#1A1A1A' }}>
        <span
          className="text-[11px] font-medium block truncate"
          style={{ color: isSelected ? '#f59e0b' : '#AEAEB2' }}
        >
          {filter.label}
        </span>
      </div>
    </button>
  );
});

export default function StudioPanelFilter({ 
  edits, 
  updateEdits, 
  previewUrl,
  onCompareStart,
  onCompareEnd,
}: StudioPanelFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterId>(edits?.filter || 'normal');
  const [intensity, setIntensity] = useState(edits?.filterIntensity ?? 100);

  const handleSelectFilter = useCallback((filterId: FilterId) => {
    setSelectedFilter(filterId);
    setIntensity(100);
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Filters</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: '#AEAEB2' }}>
            Selected: <span style={{ color: '#f59e0b' }}>{selectedLabel}</span>
          </span>
          <span className="text-[9px]" style={{ color: '#AEAEB2' }}>Hold to compare</span>
        </div>
      </div>
      
      {/* Filter grid */}
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
              onCompareStart={onCompareStart}
              onCompareEnd={onCompareEnd}
            />
          ))}
        </div>
      </div>

      {/* Intensity slider */}
      {showIntensity && (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1A1A1A' }}>
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-medium shrink-0" style={{ color: '#AEAEB2' }}>Intensity</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={intensity}
              onChange={(e) => handleIntensityChange(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-md"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            />
            <span className="text-[11px] font-mono w-8 text-right" style={{ color: '#AEAEB2' }}>{intensity}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
