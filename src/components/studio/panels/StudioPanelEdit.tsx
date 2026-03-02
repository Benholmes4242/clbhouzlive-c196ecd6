import { useState, useCallback, useMemo } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Area } from 'react-easy-crop';
import { StudioEdits, CropSettings } from '@/types/studio';
import { CropEditor } from '../CropEditor';
import { aspectRatioToNumber } from '@/utils/studioEdit';

type StudioPanelEditProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  mediaType: 'image' | 'video';
  mediaUrl?: string;
  /** When false, hides the embedded CropEditor (used when crop is on the fullscreen canvas) */
  showCropCanvas?: boolean;
};

const CROP_RATIOS = ['original', '1:1', '4:5', '16:9', '9:16'] as const;

export default function StudioPanelEdit({ edits, updateEdits, mediaType, mediaUrl, showCropCanvas = true }: StudioPanelEditProps) {
  const [cropRatio, setCropRatio] = useState<typeof CROP_RATIOS[number]>(
    edits?.crop?.ratio || 'original'
  );
  const [rotation, setRotation] = useState(edits?.rotate || 0);
  const [flipH, setFlipH] = useState(edits?.flipH || false);
  const [flipV, setFlipV] = useState(edits?.flipV || false);
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

  const handleFlipH = () => {
    const newFlipH = !flipH;
    setFlipH(newFlipH);
    updateEdits({ flipH: newFlipH });
  };

  const handleFlipV = () => {
    const newFlipV = !flipV;
    setFlipV(newFlipV);
    updateEdits({ flipV: newFlipV });
  };

  const handleCropRatio = (ratio: typeof CROP_RATIOS[number]) => {
    setCropRatio(ratio);
    setCropArea(null);
    setZoom(1);
    updateEdits({ 
      crop: { ratio, area: undefined, zoom: 1 } 
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

  const aspectRatioNum = useMemo(() => {
    return aspectRatioToNumber(cropRatio);
  }, [cropRatio]);

  const showEmbeddedCrop = showCropCanvas && mediaType === 'image' && mediaUrl;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Crop ratios */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[1.5px] mb-2" style={{ color: '#AEAEB2' }}>Crop Ratio</label>
          <div className="grid grid-cols-5 gap-1.5">
            {CROP_RATIOS.map(ratio => (
              <button
                key={ratio}
                onClick={() => handleCropRatio(ratio)}
                className="py-1.5 px-2 rounded-md text-xs font-medium transition-colors"
                style={cropRatio === ratio ? {
                  background: '#f59e0b',
                  color: '#FFFFFF',
                } : {
                  background: 'rgba(255,255,255,0.08)',
                  color: '#AEAEB2',
                }}
              >
                {ratio === 'original' ? 'Free' : ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Embedded crop editor (only shown when showCropCanvas=true, i.e. legacy/non-fullscreen usage) */}
        {showEmbeddedCrop && (
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
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-center" style={{ color: '#AEAEB2' }}>
              Video cropping applies the selected ratio. 
              Drag-to-position is available for images.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Transform controls */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[1.5px] mb-2" style={{ color: '#AEAEB2' }}>Transform</label>
          <div className="flex gap-2">
            <button
              onClick={handleRotate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors"
              style={rotation > 0 ? {
                background: '#f59e0b',
                color: '#FFFFFF',
                border: '1px solid transparent',
              } : {
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF',
              }}
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-xs font-medium">90°</span>
              {rotation > 0 && (
                <span className="text-[10px] ml-0.5 opacity-70">({rotation}°)</span>
              )}
            </button>
            
            <button
              onClick={handleFlipH}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors"
              style={flipH ? {
                background: '#f59e0b',
                color: '#FFFFFF',
                border: '1px solid transparent',
              } : {
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF',
              }}
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="text-xs font-medium">Flip H</span>
            </button>

            <button
              onClick={handleFlipV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors"
              style={flipV ? {
                background: '#f59e0b',
                color: '#FFFFFF',
                border: '1px solid transparent',
              } : {
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF',
              }}
            >
              <FlipVertical className="w-4 h-4" />
              <span className="text-xs font-medium">Flip V</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
