import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MiniCardCropToolProps {
  imageUrl: string;
  initialCrop: CropData;
  onSave: (crop: CropData) => void;
  onCancel: () => void;
}

export const MiniCardCropTool: React.FC<MiniCardCropToolProps> = ({
  imageUrl,
  initialCrop,
  onSave,
  onCancel,
}) => {
  const [crop, setCrop] = useState<CropData>(() => {
    // Ensure 3:4 aspect ratio
    const aspectRatio = 3 / 4;
    const width = Math.min(initialCrop.width, initialCrop.height * aspectRatio);
    const height = width / aspectRatio;
    
    return {
      x: Math.max(0, Math.min(100 - width, initialCrop.x)),
      y: Math.max(0, Math.min(100 - height, initialCrop.y)),
      width,
      height,
    };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if ((!isDragging && !isResizing) || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    if (isDragging) {
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY)),
      }));
    } else if (isResizing) {
      setCrop(prev => {
        const aspectRatio = 3 / 4;
        let newWidth = Math.max(10, Math.min(100 - prev.x, prev.width + deltaX));
        let newHeight = newWidth / aspectRatio;
        
        // Ensure height doesn't exceed bounds
        if (prev.y + newHeight > 100) {
          newHeight = 100 - prev.y;
          newWidth = newHeight * aspectRatio;
        }
        
        return {
          ...prev,
          width: newWidth,
          height: newHeight,
        };
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, isResizing, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    onSave(crop);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crop Mini Profile Card Photo (3:4 Aspect Ratio)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Drag the crop area to reposition and drag the bottom-right corner to resize. 
            The aspect ratio is locked to 3:4 for the mini profile card.
          </div>
          
          {/* Crop container */}
          <div 
            ref={containerRef}
            className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border-2 border-border"
          >
            <img
              src={imageUrl}
              alt="Crop preview"
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            
            {/* Crop area */}
            <div 
              className="absolute border-2 border-white bg-transparent cursor-move"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'drag')}
            >
              {/* Preview image */}
              <img
                src={imageUrl}
                alt="Cropped preview"
                className="w-full h-full object-cover"
                style={{
                  objectPosition: `${(50 - crop.x) / crop.width * 100}% ${(50 - crop.y) / crop.height * 100}%`,
                }}
                draggable={false}
              />
              
              {/* Resize handle */}
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-gray-400 cursor-se-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize');
                }}
              />
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Crop: {crop.x.toFixed(1)}%, {crop.y.toFixed(1)}% | 
              Size: {crop.width.toFixed(1)}% × {crop.height.toFixed(1)}%
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