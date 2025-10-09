import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { DraftEdits } from '@/types/studio';

type StudioPanelEditProps = {
  edits: DraftEdits | undefined;
  updateEdits: (patch: Partial<DraftEdits>) => void;
  onApply: () => void;
  onReset: () => void;
  mediaType: 'image' | 'video';
};

const CROP_RATIOS = ['original', '1:1', '4:5', '16:9'] as const;

export default function StudioPanelEdit({ edits, updateEdits, onApply, onReset, mediaType }: StudioPanelEditProps) {
  const [cropRatio, setCropRatio] = useState<typeof CROP_RATIOS[number]>(
    edits?.edit?.crop?.ratio || 'original'
  );
  const [rotation, setRotation] = useState(edits?.edit?.rotate || 0);
  const [speed, setSpeed] = useState(edits?.edit?.speed || 1);
  const [trimStart, setTrimStart] = useState(edits?.edit?.trim?.start || 0);
  const [trimEnd, setTrimEnd] = useState(edits?.edit?.trim?.end || 100);

  const handleRotate = () => {
    const newRotation = ((rotation + 90) % 360) as 0 | 90 | 180 | 270;
    setRotation(newRotation);
    updateEdits({
      edit: {
        ...edits?.edit,
        rotate: newRotation
      }
    });
  };

  const handleCropRatio = (ratio: typeof CROP_RATIOS[number]) => {
    setCropRatio(ratio);
    updateEdits({
      edit: {
        ...edits?.edit,
        crop: {
          x: 0,
          y: 0,
          w: 100,
          h: 100,
          ratio
        }
      }
    });
  };

  const handleSpeed = (newSpeed: 0.5 | 1 | 1.5) => {
    setSpeed(newSpeed);
    updateEdits({
      edit: {
        ...edits?.edit,
        speed: newSpeed
      }
    });
  };

  const handleTrim = () => {
    updateEdits({
      edit: {
        ...edits?.edit,
        trim: {
          start: trimStart,
          end: trimEnd
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Crop ratios (images & videos) */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-3">Crop Ratio</label>
          <div className="grid grid-cols-4 gap-2">
            {CROP_RATIOS.map(ratio => (
              <button
                key={ratio}
                onClick={() => handleCropRatio(ratio)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
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
          <label className="block text-sm font-medium text-zinc-700 mb-3">Rotate</label>
          <button
            onClick={handleRotate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-sm font-medium">Rotate 90°</span>
            {rotation > 0 && (
              <span className="text-xs text-zinc-500">({rotation}°)</span>
            )}
          </button>
        </div>

        {/* Video-specific controls */}
        {mediaType === 'video' && (
          <>
            {/* Speed */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">Playback Speed</label>
              <div className="grid grid-cols-3 gap-2">
                {[0.5, 1, 1.5].map(s => (
                  <button
                    key={s}
                    onClick={() => handleSpeed(s as 0.5 | 1 | 1.5)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      speed === s
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Trim */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">Trim Video</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">Start</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trimStart}
                    onChange={(e) => setTrimStart(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-zinc-500 mt-1">{trimStart}%</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">End</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-zinc-500 mt-1">{trimEnd}%</div>
                </div>
                <button
                  onClick={handleTrim}
                  className="w-full py-2 rounded-lg border border-zinc-300 text-sm font-medium hover:bg-zinc-50 transition-colors"
                >
                  Apply Trim
                </button>
              </div>
            </div>
          </>
        )}
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
