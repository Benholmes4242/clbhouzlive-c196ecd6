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
  onApply, 
  onReset,
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
      {/* Filter presets - horizontal scrollable */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-body-sm font-medium text-zinc-700">Filter</label>
          <span className="text-xs text-zinc-500">
            Selected: <span className="font-medium text-zinc-700">{selectedLabel}</span>
          </span>
        </div>
        
        {/* Horizontal scroll container */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {FILTER_OPTIONS.map(filter => {
              const isSelected = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => handleSelectFilter(filter.id)}
                  className={cn(
                    "flex-shrink-0 w-[72px] rounded-lg overflow-hidden transition-all",
                    isSelected
                      ? 'ring-2 ring-zinc-900 ring-offset-1 scale-[1.02]'
                      : 'ring-1 ring-zinc-200 hover:ring-zinc-300'
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
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className={cn(
                    "py-1.5 px-1 text-center",
                    isSelected ? 'bg-zinc-900' : 'bg-white'
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="p-4 border-t border-zinc-200 flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-sq-sm border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2.5 rounded-sq-sm bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
