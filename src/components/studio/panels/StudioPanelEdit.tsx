import { useState, useCallback, useMemo } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Area } from 'react-easy-crop';
import { StudioEdits, CropSettings } from '@/types/studio';
import { CropEditor } from '../CropEditor';
import { aspectRatioToNumber } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';

type StudioPanelEditProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  mediaType: 'image' | 'video';
  mediaUrl?: string;
};

const CROP_RATIOS = ['original', '1:1', '4:5', '16:9', '9:16'] as const;

export default function StudioPanelEdit({ edits, updateEdits, mediaType, mediaUrl }: StudioPanelEditProps) {
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

  const aspectRatioNum = useMemo(() => {
    return aspectRatioToNumber(cropRatio);
  }, [cropRatio]);

  const showCropEditor = mediaType === 'image' && mediaUrl;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Crop ratios */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Crop Ratio</label>
          <div className="grid grid-cols-5 gap-1.5">
            {CROP_RATIOS.map(ratio => (
              <button
                key={ratio}
                onClick={() => handleCropRatio(ratio)}
                className={cn(
                  "py-1.5 px-2 rounded-md border text-xs font-medium transition-colors",
                  cropRatio === ratio
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/40 bg-card text-foreground hover:bg-muted/30'
                )}
              >
                {ratio === 'original' ? 'Free' : ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Crop editor */}
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
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground text-center">
              Video cropping applies the selected ratio. 
              Drag-to-position is available for images.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Transform controls — rotate + flip in a row */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Transform</label>
          <div className="flex gap-2">
            <button
              onClick={handleRotate}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors",
                rotation > 0
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-border/40 bg-muted/30 hover:bg-muted/50 text-muted-foreground'
              )}
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-xs font-medium">90°</span>
              {rotation > 0 && (
                <span className="text-[10px] text-muted-foreground ml-0.5">({rotation}°)</span>
              )}
            </button>
            
            <button
              onClick={handleFlipH}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors",
                flipH
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-border/40 bg-muted/30 hover:bg-muted/50 text-muted-foreground'
              )}
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="text-xs font-medium">Flip H</span>
            </button>

            <button
              onClick={handleFlipV}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors",
                flipV
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-border/40 bg-muted/30 hover:bg-muted/50 text-muted-foreground'
              )}
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
