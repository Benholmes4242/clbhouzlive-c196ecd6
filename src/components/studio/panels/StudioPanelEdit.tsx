import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { StudioEdits } from '@/types/studio';

type StudioPanelEditProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  mediaType: 'image' | 'video';
};

const CROP_RATIOS = ['original', '1:1', '4:5', '16:9'] as const;

export default function StudioPanelEdit({ edits, updateEdits, mediaType }: StudioPanelEditProps) {
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
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Crop ratios */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-2">Crop Ratio</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CROP_RATIOS.map(ratio => (
              <button
                key={ratio}
                onClick={() => handleCropRatio(ratio)}
                className={`py-1.5 px-2 rounded-md border text-xs font-medium transition-colors ${
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

        {/* Subtle divider */}
        <div className="h-px bg-zinc-100" />

        {/* Rotate - secondary utility */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Rotate</label>
          <button
            onClick={handleRotate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors text-zinc-600"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-xs font-medium">90°</span>
            {rotation > 0 && (
              <span className="text-[10px] text-zinc-400 ml-1">({rotation}°)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
