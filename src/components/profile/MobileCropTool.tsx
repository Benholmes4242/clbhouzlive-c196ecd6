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
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  const [cropData, setCropData] = useState<CropData>(
    initialCrop || { x: 25, y: 25, width: 50, height: 66.67 } // 3:4 aspect ratio
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);

  // Calculate crop box dimensions maintaining 3:4 aspect ratio
  const calculateCropDimensions = useCallback((containerWidth: number) => {
    const maxWidth = Math.min(containerWidth * 0.8, 300);
    const width = maxWidth;
    const height = width * (4/3); // 3:4 aspect ratio
    return { width, height };
  }, []);

  // Reset crop to center with proper aspect ratio
  const resetCrop = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current;
    const image = imageRef.current;
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    // Calculate the crop dimensions
    const { width: cropWidth, height: cropHeight } = calculateCropDimensions(containerRect.width);
    
    // Center the crop box
    const x = 50 - (cropWidth / containerRect.width * 100) / 2;
    const y = 50 - (cropHeight / containerRect.height * 100) / 2;
    const width = (cropWidth / containerRect.width) * 100;
    const height = (cropHeight / containerRect.height) * 100;
    
    setCropData({ x, y, width, height });
  }, [calculateCropDimensions]);

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

  // Handle mouse/touch events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Handle touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    const deltaXPercent = (deltaX / containerRect.width) * 100;
    const deltaYPercent = (deltaY / containerRect.height) * 100;
    
    setCropData(prev => {
      const newX = Math.max(0, Math.min(100 - prev.width, prev.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - prev.height, prev.y + deltaYPercent));
      return { ...prev, x: newX, y: newY };
    });
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    
    const deltaXPercent = (deltaX / containerRect.width) * 100;
    const deltaYPercent = (deltaY / containerRect.height) * 100;
    
    setCropData(prev => {
      const newX = Math.max(0, Math.min(100 - prev.width, prev.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - prev.height, prev.y + deltaYPercent));
      return { ...prev, x: newX, y: newY };
    });
    
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
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
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove]);

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
        
        <div className="p-4 space-y-6">
          {/* Main crop area */}
          <div className="flex-1">
            <div 
              ref={containerRef}
              className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
              style={{ 
                aspectRatio: '1 / 1', 
                maxWidth: '400px',
                width: '100%',
                height: 'auto'
              }}
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
                  <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                  
                  {/* Crop box */}
                  <div
                    ref={cropBoxRef}
                    className="absolute border-2 border-white bg-transparent cursor-move select-none touch-none"
                    style={{
                      left: `${cropData.x}%`,
                      top: `${cropData.y}%`,
                      width: `${cropData.width}%`,
                      height: `${cropData.height}%`,
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                  >
                    {/* Grid overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-white/30" />
                      ))}
                    </div>
                    
                    {/* Crop box corners for visual feedback */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full pointer-events-none" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full pointer-events-none" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full pointer-events-none" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full pointer-events-none" />
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground space-y-1 text-center">
              <p>• Drag to reposition the crop area</p>
              <p>• Use mouse wheel to zoom in/out</p>
              <p>• The crop maintains a 3:4 aspect ratio for mobile</p>
            </div>
          </div>
          
          {/* Preview panel - now below crop area */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <h4 className="font-medium mb-4">Mobile Preview</h4>
              <div className="rounded-lg overflow-hidden mx-auto" style={{ width: '120px', height: '150px' }}>
                <img
                  src={imageUrl}
                  alt="Mobile preview"
                  className="w-full h-full object-cover"
                  style={getPreviewStyle()}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                How it appears in mobile header
              </p>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetCrop}
                className="gap-2"
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