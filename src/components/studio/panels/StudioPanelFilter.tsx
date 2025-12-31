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

const FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'vivid', label: 'Vivid' },
  { id: 'bw', label: 'B&W' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'matte', label: 'Matte' },
  { id: 'pop', label: 'Pop' },
  { id: 'fade', label: 'Fade' },
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

  return (
    <div className="flex flex-col h-full">
      {/* Filter presets - horizontal scrollable */}
      <div className="p-4 space-y-3">
        <label className="block text-body-sm font-medium text-zinc-700">Filter</label>
        
        {/* Horizontal scroll container */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {FILTER_OPTIONS.map(filter => (
              <button
                key={filter.id}
                onClick={() => handleSelectFilter(filter.id)}
                className={cn(
                  "flex-shrink-0 w-20 rounded-sq-sm border-2 transition-all overflow-hidden",
                  selectedFilter === filter.id
                    ? 'border-zinc-900 shadow-lg ring-1 ring-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300'
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
                </div>
                
                {/* Label */}
                <div className="py-1.5 px-1 bg-white border-t border-zinc-100">
                  <span className={cn(
                    "text-xs font-medium block text-center truncate",
                    selectedFilter === filter.id ? 'text-zinc-900' : 'text-zinc-600'
                  )}>
                    {filter.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected filter indicator */}
        <div className="text-center text-xs text-zinc-500">
          Selected: <span className="font-medium text-zinc-700">{FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label}</span>
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
