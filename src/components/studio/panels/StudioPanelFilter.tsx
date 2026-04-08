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
      className="flex flex-col items-center gap-1.5 active:scale-[0.96] transition-transform"
      style={{ width: 80, flexShrink: 0 }}
    >
      <div
        className="w-full aspect-square overflow-hidden"
        style={{
          borderRadius: 12,
          border: isSelected ? '2px solid #F7931E' : '2px solid rgba(255,255,255,0.08)',
        }}
      >
        {previewUrl ? (
          <div className={`w-full h-full ${isComparing ? '' : getFilterClass(filter.id)}`}>
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
      </div>

      <span
        className="text-[11px] block truncate w-full text-center"
        style={{
          color: isSelected ? '#F7931E' : 'rgba(255,255,255,0.45)',
          fontWeight: isSelected ? 700 : 400,
        }}
      >
        {filter.label}
      </span>
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
      {/* Subtitle */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Selected: <span style={{ color: 'rgba(255,255,255,0.70)' }}>{selectedLabel}</span> · Hold to compare
        </span>
      </div>

      {/* Horizontal scrolling filter rail */}
      <div
        className="flex-shrink-0"
        style={{
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          gap: 8,
          padding: '8px 16px',
        }}
      >
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

      {/* Intensity section */}
      {showIntensity && (
        <div className="px-4 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
            }}>
              Intensity
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F7931E' }}>
              {intensity}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={intensity}
            onChange={(e) => handleIntensityChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
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
            style={{
              background: `linear-gradient(to right, #F7931E ${intensity}%, rgba(255,255,255,0.10) ${intensity}%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
