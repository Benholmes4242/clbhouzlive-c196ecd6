import { useState } from 'react';
import { StudioEdits, FilterId } from '@/types/studio';
import { FILTERS } from '@/utils/filters';

type StudioPanelFilterProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
};

const FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'vivid', label: 'Vivid' },
  { id: 'bw', label: 'B&W' },
  { id: 'dramatic', label: 'Dramatic' },
];

export default function StudioPanelFilter({ edits, updateEdits, onApply, onReset }: StudioPanelFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterId>(edits?.filter || 'normal');

  const handleSelectFilter = (filterId: FilterId) => {
    setSelectedFilter(filterId);
    updateEdits({ filter: filterId });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter presets */}
      <div className="p-4 space-y-3">
        <label className="block text-body-sm font-medium text-zinc-700">Filter</label>
        <div className="grid grid-cols-3 gap-3">
          {FILTER_OPTIONS.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleSelectFilter(filter.id)}
              className={`aspect-square rounded-lg border-2 transition-all overflow-hidden ${
                selectedFilter === filter.id
                  ? 'border-zinc-900 shadow-lg'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div 
                className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-300 flex items-center justify-center"
                style={{ filter: FILTERS[filter.id] }}
              >
                <span className="text-xs font-medium text-zinc-700">{filter.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="p-4 border-t border-zinc-200 flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
