import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PROFILE_PANEL_OVERLAP_PX } from '@/components/profile/profile-config';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HeaderCropToolProps {
  imageUrl: string;
  initialCrop: CropData;
  mode: 'mobile' | 'desktop';
  onSave: (crop: CropData) => void;
  onCancel: () => void;
}

export const HeaderCropTool: React.FC<HeaderCropToolProps> = ({
  imageUrl,
  initialCrop,
  mode,
  onSave,
  onCancel,
}) => {
  const [crop, setCrop] = useState<CropData>(initialCrop);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
      y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY)),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 0.9 : 1.1;
    const newWidth = Math.max(20, Math.min(100, crop.width * factor));
    const newHeight = Math.max(20, Math.min(100, crop.height * factor));
    
    // Keep the center position the same
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    
    setCrop({
      x: Math.max(0, Math.min(100 - newWidth, centerX - newWidth / 2)),
      y: Math.max(0, Math.min(100 - newHeight, centerY - newHeight / 2)),
      width: newWidth,
      height: newHeight,
    });
  };

  const handleSave = () => {
    onSave(crop);
  };

  const safeZoneHeight = (PROFILE_PANEL_OVERLAP_PX / 400) * 100; // Assuming 400px container height

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Crop Header Photo - {mode === 'mobile' ? 'Mobile' : 'Desktop'} View
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Drag to reposition and use zoom controls to adjust the crop area. 
            The shaded area at the bottom shows what will be covered by your profile panel.
          </div>
          
          {/* Crop container */}
          <div 
            ref={containerRef}
            className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden cursor-move border-2 border-border"
            onMouseDown={handleMouseDown}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${crop.x + crop.width / 2}% ${crop.y + crop.height / 2}%`,
                transform: `scale(${100 / Math.min(crop.width, crop.height)})`,
              }}
            />
            
            {/* Safe zone overlay */}
            <div 
              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white/70 via-white/50 to-transparent pointer-events-none"
              style={{ height: `${safeZoneHeight}%` }}
            />
            
            {/* Safe zone indicator */}
            <div className="absolute bottom-4 left-4 bg-[#0a0a0a]/70 text-white text-xs px-2 py-1 rounded">
              Panel overlap area
            </div>
            
            {/* Crop boundary indicator */}
            <div 
              className="absolute border-2 border-white border-dashed pointer-events-none"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('in')}
              >
                Zoom In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('out')}
              >
                Zoom Out
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Crop
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
