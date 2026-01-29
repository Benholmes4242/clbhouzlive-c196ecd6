import { useState, useCallback, useMemo } from 'react';
import { RotateCw } from 'lucide-react';
import { Area } from 'react-easy-crop';
import { StudioEdits, CropSettings } from '@/types/studio';
import { CropEditor } from '../CropEditor';
import { aspectRatioToNumber } from '@/utils/studioEdit';

type StudioPanelEditProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  mediaType: 'image' | 'video';
  /** URL of the media to crop */
  mediaUrl?: string;
};

const CROP_RATIOS = ['original', '1:1', '4:5', '16:9', '9:16'] as const;

export default function StudioPanelEdit({ edits, updateEdits, mediaType, mediaUrl }: StudioPanelEditProps) {
  const [cropRatio, setCropRatio] = useState<typeof CROP_RATIOS[number]>(
    edits?.crop?.ratio || 'original'
  );
  const [rotation, setRotation] = useState(edits?.rotate || 0);
  const [cropArea, setCropArea] = useState<Area | null>(
    edits?.crop?.area ? {
      x: edits.crop.area.x,
      y: edits.crop.area.y,
      width: edits.crop.area.width,
      height: edits.crop.area.height,
    } : null
  );
  const [zoom, setZoom] = useState(edits?.crop?.zoom || 1);

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    updateEdits({ rotate: newRotation });
  };

  const handleCropRatio = (ratio: typeof CROP_RATIOS[number]) => {
    setCropRatio(ratio);
    // Reset crop area when ratio changes
    setCropArea(null);
    setZoom(1);
    updateEdits({ 
      crop: { 
        ratio,
        area: undefined,
        zoom: 1,
      } 
    });
  };

  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCropArea(croppedArea);
    updateEdits({
      crop: {
        ratio: cropRatio,
        area: {
          x: croppedArea.x,
          y: croppedArea.y,
          width: croppedArea.width,
          height: croppedArea.height,
        },
        zoom: zoom,
      },
    });
  }, [cropRatio, zoom, updateEdits]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  // Get numeric aspect ratio for the cropper
  const aspectRatioNum = useMemo(() => {
    return aspectRatioToNumber(cropRatio);
  }, [cropRatio]);

  // Show crop editor only for images with a URL
  const showCropEditor = mediaType === 'image' && mediaUrl;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Crop ratios */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-2">Crop Ratio</label>
          <div className="grid grid-cols-5 gap-1.5">
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
                {ratio === 'original' ? 'Free' : ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Crop editor - interactive drag to position */}
        {showCropEditor && (
          <div className="h-[280px]">
            <CropEditor
              imageSrc={mediaUrl}
              aspectRatio={aspectRatioNum}
              initialZoom={zoom}
              onCropComplete={handleCropComplete}
              onZoomChange={handleZoomChange}
            />
          </div>
        )}

        {/* Hint for videos */}
        {mediaType === 'video' && (
          <div className="bg-zinc-50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 text-center">
              Video cropping applies the selected ratio. 
              Drag-to-position is available for images.
            </p>
          </div>
        )}

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
