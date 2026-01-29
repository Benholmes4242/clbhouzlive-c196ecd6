/**
 * CropEditor - Interactive crop tool using react-easy-crop
 * 
 * Allows users to drag, pan, and zoom to select a crop region.
 */

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { cn } from '@/lib/utils';

export interface CropEditorProps {
  /** Source URL for the image/video to crop */
  imageSrc: string;
  /** Initial crop position */
  initialCrop?: Point;
  /** Initial zoom level (1-3) */
  initialZoom?: number;
  /** Aspect ratio (undefined = free crop) */
  aspectRatio?: number;
  /** Called when crop is completed */
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  /** Called when crop position changes */
  onCropChange?: (crop: Point) => void;
  /** Called when zoom changes */
  onZoomChange?: (zoom: number) => void;
  /** Additional class name */
  className?: string;
}

export const CropEditor: React.FC<CropEditorProps> = ({
  imageSrc,
  initialCrop = { x: 0, y: 0 },
  initialZoom = 1,
  aspectRatio,
  onCropComplete,
  onCropChange,
  onZoomChange,
  className,
}) => {
  const [crop, setCrop] = useState<Point>(initialCrop);
  const [zoom, setZoom] = useState(initialZoom);

  const handleCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
    onCropChange?.(newCrop);
  }, [onCropChange]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [onZoomChange]);

  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    onCropComplete(croppedArea, croppedAreaPixels);
  }, [onCropComplete]);

  return (
    <div className={cn('relative w-full h-full min-h-[250px]', className)}>
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={aspectRatio}
        onCropChange={handleCropChange}
        onZoomChange={handleZoomChange}
        onCropComplete={handleCropComplete}
        showGrid={true}
        classes={{
          containerClassName: 'rounded-xl overflow-hidden',
          cropAreaClassName: 'border-2 border-white/80 shadow-lg',
        }}
        style={{
          containerStyle: {
            background: 'rgba(0,0,0,0.85)',
            borderRadius: '12px',
          },
          cropAreaStyle: {
            border: '2px solid rgba(255,255,255,0.9)',
          },
        }}
      />
      
      {/* Zoom slider - bottom overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-sm">
        <span className="text-white/70 text-xs font-medium shrink-0">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-md"
        />
        <span className="text-white/50 text-xs tabular-nums w-8 text-right">
          {zoom.toFixed(1)}x
        </span>
      </div>
    </div>
  );
};

export default CropEditor;
