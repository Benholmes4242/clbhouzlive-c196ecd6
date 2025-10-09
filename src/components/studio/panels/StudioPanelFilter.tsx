import { useState } from 'react';
import { DraftEdits } from '@/types/studio';

type StudioPanelFilterProps = {
  edits: DraftEdits | undefined;
  updateEdits: (patch: Partial<DraftEdits>) => void;
  onApply: () => void;
  onReset: () => void;
};

const FILTERS = [
  { name: 'normal' as const, label: 'Normal' },
  { name: 'fade' as const, label: 'Fade' },
  { name: 'warm' as const, label: 'Warm' },
  { name: 'cool' as const, label: 'Cool' },
];

export default function StudioPanelFilter({ edits, updateEdits, onApply, onReset }: StudioPanelFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState(edits?.filter?.name || 'normal');
  const [intensity, setIntensity] = useState(edits?.filter?.intensity ?? 50);

  const handleSelectFilter = (name: typeof FILTERS[0]['name']) => {
    setSelectedFilter(name);
    updateEdits({
      filter: {
        name,
        intensity
      }
    });
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(value);
    updateEdits({
      filter: {
        name: selectedFilter,
        intensity: value
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter presets */}
      <div className="p-4 space-y-3">
        <label className="block text-sm font-medium text-zinc-700">Filter</label>
        <div className="grid grid-cols-4 gap-3">
          {FILTERS.map(filter => (
            <button
              key={filter.name}
              onClick={() => handleSelectFilter(filter.name)}
              className={`aspect-square rounded-lg border-2 transition-all ${
                selectedFilter === filter.name
                  ? 'border-zinc-900 shadow-lg'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="w-full h-full rounded-md bg-gradient-to-br from-zinc-100 to-zinc-300 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-700">{filter.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity slider */}
      {selectedFilter !== 'normal' && (
        <div className="p-4 border-t border-zinc-200 space-y-3">
          <label className="block text-sm font-medium text-zinc-700">Intensity</label>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-zinc-500 text-center">{intensity}%</div>
        </div>
      )}

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
