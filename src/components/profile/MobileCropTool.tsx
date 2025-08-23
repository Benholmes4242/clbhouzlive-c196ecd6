import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';

interface CropData {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

interface MobileCropToolProps {
  imageUrl: string;
  initialCrop?: CropData;
  onSave: (cropData: CropData) => void;
  onCancel: () => void;
  userId?: string;
}

const MobileCropTool: React.FC<MobileCropToolProps> = ({
  imageUrl,
  initialCrop,
  onSave,
  onCancel,
  userId
}) => {
  const { toast } = useToast();
  const { trackMobileCropOpened, trackMobileCropSaved } = useProfileAnalytics(userId);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  
  const [cropData, setCropData] = useState<CropData>(
    initialCrop || { x: 20, y: 20, width: 60, height: 60 } // Square default, user can adjust
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);

  // Calculate crop box dimensions with minimum constraints
  const calculateCropDimensions = useCallback((containerWidth: number) => {
    const minSize = Math.min(containerWidth * 0.2, 80); // Minimum 20% or 80px
    const maxSize = Math.min(containerWidth * 0.9, 400); // Maximum 90% or 400px
    return { minSize, maxSize };
  }, []);

  // Reset crop to center with adjustable size
  const resetCrop = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Set a reasonable default size - 60% of container
    const defaultSize = 60;
    
    // Center the crop box
    const x = (100 - defaultSize) / 2;
    const y = (100 - defaultSize) / 2;
    
    setCropData({ x, y, width: defaultSize, height: defaultSize });
  }, []);

  // Initialize crop on image load and track analytics
  useEffect(() => {
    if (imageLoaded && !initialCrop) {
      resetCrop();
    }
    // Track that mobile crop tool was opened
    if (imageLoaded) {
      trackMobileCropOpened();
    }
  }, [imageLoaded, initialCrop, resetCrop, trackMobileCropOpened]);

  // Handle mouse/touch events for dragging and resizing
  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if ((!isDragging && !isResizing) || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const deltaXPercent = (deltaX / containerRect.width) * 100;
    const deltaYPercent = (deltaY / containerRect.height) * 100;
    
    if (isDragging) {
      // Move the crop area
      setCropData(prev => {
        const newX = Math.max(0, Math.min(100 - prev.width, prev.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - prev.height, prev.y + deltaYPercent));
        return { ...prev, x: newX, y: newY };
      });
    } else if (isResizing) {
      // Resize the crop area
      setCropData(prev => {
        let newCrop = { ...prev };
        const minSize = 10; // Minimum 10%
        const maxSize = 90; // Maximum 90%
        
        switch (resizeHandle) {
          case 'nw': // Top-left
            newCrop.width = Math.max(minSize, Math.min(maxSize, prev.width - deltaXPercent));
            newCrop.height = Math.max(minSize, Math.min(maxSize, prev.height - deltaYPercent));
            newCrop.x = Math.max(0, Math.min(100 - newCrop.width, prev.x + deltaXPercent));
            newCrop.y = Math.max(0, Math.min(100 - newCrop.height, prev.y + deltaYPercent));
            break;
          case 'ne': // Top-right
            newCrop.width = Math.max(minSize, Math.min(maxSize, prev.width + deltaXPercent));
            newCrop.height = Math.max(minSize, Math.min(maxSize, prev.height - deltaYPercent));
            newCrop.y = Math.max(0, Math.min(100 - newCrop.height, prev.y + deltaYPercent));
            break;
          case 'sw': // Bottom-left
            newCrop.width = Math.max(minSize, Math.min(maxSize, prev.width - deltaXPercent));
            newCrop.height = Math.max(minSize, Math.min(maxSize, prev.height + deltaYPercent));
            newCrop.x = Math.max(0, Math.min(100 - newCrop.width, prev.x + deltaXPercent));
            break;
          case 'se': // Bottom-right
            newCrop.width = Math.max(minSize, Math.min(maxSize, prev.width + deltaXPercent));
            newCrop.height = Math.max(minSize, Math.min(maxSize, prev.height + deltaYPercent));
            break;
        }
        
        // Ensure crop doesn't go outside bounds
        if (newCrop.x + newCrop.width > 100) newCrop.width = 100 - newCrop.x;
        if (newCrop.y + newCrop.height > 100) newCrop.height = 100 - newCrop.y;
        
        return newCrop;
      });
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, isResizing, resizeHandle, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  // Handle wheel event for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  // Add event listeners
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
    // Track mobile crop save with crop data
    trackMobileCropSaved(cropData);
    onSave(cropData);
  };

  // Generate preview style
  const getPreviewStyle = () => {
    if (!imageLoaded) return {};
    
    return {
      objectPosition: `${cropData.x + cropData.width/2}% ${cropData.y + cropData.height/2}%`,
      transform: `scale(${100/cropData.width * 0.6})`, // Zoom to show the cropped area
    };
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Mobile Profile Photo Crop</h3>
          <p className="text-sm text-muted-foreground">
            Adjust the crop area to control how your photo appears on mobile
          </p>
        </div>
        
        <div className="p-4 flex gap-6">
          {/* Main crop area */}
          <div className="flex-1">
            <div 
              ref={containerRef}
              className="relative bg-gray-100 rounded-lg overflow-hidden"
              style={{ aspectRatio: '1 / 1', minHeight: '400px' }}
              onWheel={handleWheel}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Profile photo to crop"
                className="w-full h-full object-cover"
                style={{ transform: `scale(${scale})` }}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
              
              {/* Crop box overlay */}
              {imageLoaded && (
                <>
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/50" />
                  
                  {/* Crop box */}
                  <div
                    ref={cropBoxRef}
                    className="absolute border-2 border-white bg-transparent cursor-move"
                    style={{
                      left: `${cropData.x}%`,
                      top: `${cropData.y}%`,
                      width: `${cropData.width}%`,
                      height: `${cropData.height}%`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e)}
                  >
                    {/* Grid overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-white/30" />
                      ))}
                    </div>
                    
                    {/* Resize handles */}
                    <div 
                      className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full cursor-nw-resize border border-gray-300 hover:bg-blue-500 transition-colors" 
                      onMouseDown={(e) => handleMouseDown(e, 'nw')}
                    />
                    <div 
                      className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full cursor-ne-resize border border-gray-300 hover:bg-blue-500 transition-colors" 
                      onMouseDown={(e) => handleMouseDown(e, 'ne')}
                    />
                    <div 
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full cursor-sw-resize border border-gray-300 hover:bg-blue-500 transition-colors" 
                      onMouseDown={(e) => handleMouseDown(e, 'sw')}
                    />
                    <div 
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full cursor-se-resize border border-gray-300 hover:bg-blue-500 transition-colors" 
                      onMouseDown={(e) => handleMouseDown(e, 'se')}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p>• Drag the crop area to reposition</p>
              <p>• Drag corner handles to resize</p>
              <p>• Use mouse wheel to zoom in/out</p>
              <p>• Choose any size and position you prefer</p>
            </div>
          </div>
          
          {/* Preview panel */}
          <div className="w-64 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Mobile preview</h4>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="w-16 h-20 mx-auto rounded-lg overflow-hidden bg-white">
                  <img
                    src={imageUrl}
                    alt="Mobile preview"
                    className="w-full h-full object-cover"
                    style={getPreviewStyle()}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  How it appears in mobile header
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetCrop}
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Center
              </Button>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Crop: {cropData.x.toFixed(1)}%, {cropData.y.toFixed(1)}%</p>
                <p>Size: {cropData.width.toFixed(1)}% × {cropData.height.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Crop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileCropTool;