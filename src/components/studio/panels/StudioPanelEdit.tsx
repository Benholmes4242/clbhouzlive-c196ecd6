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
  showCropCanvas?: boolean;
};

const CROP_RATIOS = ['original', '1:1', '4:5', '16:9', '9:16'] as const;

// Ratio shape dimensions for visual tiles
const RATIO_SHAPES: Record<string, { w: number; h: number }> = {
  'original': { w: 16, h: 12 },
  '1:1': { w: 14, h: 14 },
  '4:5': { w: 12, h: 15 },
  '16:9': { w: 18, h: 10 },
  '9:16': { w: 10, h: 18 },
};

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
        {/* Aspect Ratio */}
        <div>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.28)',
          }}>
            Aspect Ratio
          </span>
          <div className="flex gap-2 mt-2">
            {CROP_RATIOS.map(ratio => {
              const isActive = cropRatio === ratio;
              const shape = RATIO_SHAPES[ratio];
              return (
                <button
                  key={ratio}
                  onClick={() => handleCropRatio(ratio)}
                  className="flex flex-col items-center gap-1.5 py-2 px-3 transition-all"
                  style={{
                    borderRadius: 12,
                    background: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)',
                    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.07)',
                    color: isActive ? '#050505' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {/* Shape preview */}
                  <div style={{
                    width: shape.w,
                    height: shape.h,
                    border: `1.5px solid ${isActive ? '#050505' : 'rgba(255,255,255,0.35)'}`,
                    borderRadius: 2,
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>
                    {ratio === 'original' ? 'Original' : ratio}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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

        {mediaType === 'video' && (
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Video cropping applies the selected ratio.
              Drag-to-position is available for images.
            </p>
          </div>
        )}

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Transform */}
        <div>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.28)',
          }}>
            Transform
          </span>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              onClick={handleRotate}
              className="flex flex-col items-center gap-1.5 transition-colors"
              style={{
                padding: '10px 0',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <RotateCw className="w-5 h-5" style={{ color: rotation > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Rotate</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>{rotation}°</span>
            </button>

            <button
              onClick={handleFlipH}
              className="flex flex-col items-center gap-1.5 transition-colors"
              style={{
                padding: '10px 0',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <FlipHorizontal className="w-5 h-5" style={{ color: flipH ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Flip H</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>{flipH ? 'On' : 'Off'}</span>
            </button>

            <button
              onClick={handleFlipV}
              className="flex flex-col items-center gap-1.5 transition-colors"
              style={{
                padding: '10px 0',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <FlipVertical className="w-5 h-5" style={{ color: flipV ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Flip V</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>{flipV ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
