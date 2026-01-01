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
      {/* Large live preview of current filter */}
      <div className="px-4 pt-2 pb-3">
        <div className="relative aspect-[4/3] max-h-[200px] rounded-xl overflow-hidden" style={{ background: 'var(--cm-surface-alt)' }}>
          {previewUrl ? (
            <div className={cn("w-full h-full", getFilterClass(selectedFilter))}>
              <img 
                src={previewUrl} 
                alt="Filter preview"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ) : (
            <div 
              className={cn(
                "w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600",
                getFilterClass(selectedFilter)
              )}
            />
          )}
          {/* Current filter label overlay */}
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-xs font-medium text-white">{selectedLabel}</span>
          </div>
        </div>
      </div>

      {/* Filter presets - horizontal scrollable */}
      <div className="p-4 pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-body-sm font-medium" style={{ color: 'var(--cm-text-secondary)' }}>Choose a filter</label>
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
                      ? 'ring-2 ring-offset-1 scale-[1.02]'
                      : 'ring-1 hover:ring-2'
                  )}
                  style={{
                    '--tw-ring-color': isSelected ? 'var(--cm-text-primary)' : 'var(--cm-border)',
                    '--tw-ring-offset-color': 'var(--cm-surface-card)',
                  } as React.CSSProperties}
                >
                  {/* Preview tile with filter applied */}
                  <div className="aspect-square relative overflow-hidden" style={{ background: 'var(--cm-surface-alt)' }}>
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
                      <div 
                        className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--cm-text-primary)' }}
                      >
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <div 
                    className="py-1.5 px-1 text-center"
                    style={{ 
                      background: isSelected ? 'var(--cm-text-primary)' : 'var(--cm-surface-card)',
                    }}
                  >
                    <span 
                      className="text-[11px] font-medium block truncate"
                      style={{ color: isSelected ? 'white' : 'var(--cm-text-secondary)' }}
                    >
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
      <div 
        className="p-4 flex gap-3"
        style={{ borderTop: '1px solid var(--cm-border-subtle)' }}
      >
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl font-medium transition-colors"
          style={{ 
            background: 'var(--cm-surface-alt)',
            border: '1px solid var(--cm-border-subtle)',
            color: 'var(--cm-text-primary)',
          }}
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2.5 rounded-xl font-semibold transition-colors"
          style={{ 
            background: 'var(--cm-surface-slate)',
            color: 'white',
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
