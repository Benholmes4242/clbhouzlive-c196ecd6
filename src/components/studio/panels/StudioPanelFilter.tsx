import { useState } from 'react';
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

export default function StudioPanelFilter({ 
  edits, 
  updateEdits, 
  previewUrl 
}: StudioPanelFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterId>(edits?.filter || 'normal');

  const handleSelectFilter = (filterId: FilterId) => {
    setSelectedFilter(filterId);
    updateEdits({ filter: filterId });
  };

  const selectedLabel = FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label || 'Pure';

  return (
    <div className="flex flex-col h-full">
      {/* Filter presets - header + 3-column grid */}
      <div className="flex flex-col h-full">
        {/* Compact header row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <span className="text-xs font-medium text-zinc-600">Filters</span>
          <span className="text-[11px] text-zinc-500">
            Selected: {selectedLabel}
          </span>
        </div>
        
        {/* 3-column grid with internal scroll */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <div className="grid grid-cols-3 gap-3">
            {FILTER_OPTIONS.map(filter => {
              const isSelected = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => handleSelectFilter(filter.id)}
                  className={cn(
                    "rounded-xl overflow-hidden transition-all duration-150",
                    isSelected
                      ? 'ring-[1.5px] ring-zinc-500/50 ring-offset-2 ring-offset-white'
                      : 'ring-1 ring-zinc-200/80 hover:ring-zinc-300'
                  )}
                >
                  {/* Preview tile with filter applied */}
                  <div className="aspect-square relative overflow-hidden bg-zinc-100">
                    {previewUrl ? (
                      <div className={cn("w-full h-full", getFilterClass(filter.id))}>
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
                          getFilterClass(filter.id)
                        )}
                      />
                    )}
                    
                    {/* Selected indicator - subtle checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-zinc-700/90 flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Label - compact */}
                  <div className={cn(
                    "py-1.5 px-1 text-center transition-colors duration-150",
                    isSelected ? 'bg-zinc-700' : 'bg-white'
                  )}>
                    <span className={cn(
                      "text-[11px] font-medium block truncate",
                      isSelected ? 'text-white' : 'text-zinc-600'
                    )}>
                      {filter.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
