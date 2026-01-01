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
      {/* Filter presets - compact header + horizontal scroll */}
      <div className="px-3 pt-2 pb-1">
        {/* Compact header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-600">Filter</span>
          <span className="text-[11px] text-zinc-400">
            {selectedLabel}
          </span>
        </div>
        
        {/* Horizontal scroll container - tighter spacing */}
        <div className="overflow-x-auto -mx-3 px-3 pb-1 scrollbar-hide">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            {FILTER_OPTIONS.map(filter => {
              const isSelected = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => handleSelectFilter(filter.id)}
                  className={cn(
                    "flex-shrink-0 w-[64px] rounded-md overflow-hidden transition-all",
                    isSelected
                      ? 'ring-[1.5px] ring-zinc-800 ring-offset-1'
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
                      <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-zinc-900/90 flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Label - compact */}
                  <div className={cn(
                    "py-1 px-0.5 text-center",
                    isSelected ? 'bg-zinc-800' : 'bg-white'
                  )}>
                    <span className={cn(
                      "text-[10px] font-medium block truncate",
                      isSelected ? 'text-white' : 'text-zinc-500'
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
