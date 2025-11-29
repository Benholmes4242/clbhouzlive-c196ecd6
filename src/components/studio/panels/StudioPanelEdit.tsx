import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { StudioEdits } from '@/types/studio';

type StudioPanelEditProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
  mediaType: 'image' | 'video';
};

const CROP_RATIOS = ['original', '1:1', '4:5', '16:9'] as const;

export default function StudioPanelEdit({ edits, updateEdits, onApply, onReset, mediaType }: StudioPanelEditProps) {
  const [cropRatio, setCropRatio] = useState<typeof CROP_RATIOS[number]>(
    edits?.crop?.ratio || 'original'
  );
  const [rotation, setRotation] = useState(edits?.rotate || 0);

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    updateEdits({ rotate: newRotation });
  };

  const handleCropRatio = (ratio: typeof CROP_RATIOS[number]) => {
    setCropRatio(ratio);
    updateEdits({ crop: { ratio } });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Crop ratios (images & videos) */}
        <div>
          <label className="block text-body-sm font-medium text-zinc-700 mb-3">Crop Ratio</label>
          <div className="grid grid-cols-4 gap-2">
            {CROP_RATIOS.map(ratio => (
              <button
                key={ratio}
                onClick={() => handleCropRatio(ratio)}
                className={`py-2 px-3 rounded-lg border text-body-md font-medium transition-colors ${
                  cropRatio === ratio
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {ratio === 'original' ? 'Original' : ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Rotate (images & videos) */}
        <div>
          <label className="block text-body-sm font-medium text-zinc-700 mb-3">Rotate</label>
          <button
            onClick={handleRotate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-sm font-medium">Rotate 90°</span>
            {rotation > 0 && (
              <span className="text-xs text-zinc-500">({rotation}°)</span>
            )}
          </button>
        </div>
      </div>

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
