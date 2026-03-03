/**
 * ImageCropModal - Unified image cropper for logo and cover photos
 * Uses react-easy-crop for intuitive crop/zoom experience
 */
import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, RotateCcw } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  aspectRatio: number; // 1 for logo, 3.2 for cover
  onCropComplete: (croppedFile: File) => void;
  title?: string;
}

// Create canvas to extract cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputFileName: string = 'cropped.jpg'
): Promise<File> {
  const image = await createImage(imageSrc);
  
  // Debug logging
  console.log('[Crop] Image natural dimensions:', image.naturalWidth, 'x', image.naturalHeight);
  console.log('[Crop] Pixel crop area:', pixelCrop);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Validate crop area is within image bounds
  const safeX = Math.max(0, Math.min(pixelCrop.x, image.naturalWidth - 1));
  const safeY = Math.max(0, Math.min(pixelCrop.y, image.naturalHeight - 1));
  const safeWidth = Math.min(pixelCrop.width, image.naturalWidth - safeX);
  const safeHeight = Math.min(pixelCrop.height, image.naturalHeight - safeY);
  
  console.log('[Crop] Safe crop area:', { x: safeX, y: safeY, width: safeWidth, height: safeHeight });

  // Set canvas size to the cropped area dimensions
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  // Draw the cropped portion of the image onto the canvas
  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    image,
    safeX,        // Source X - where to start cropping from the original image
    safeY,        // Source Y
    safeWidth,    // Source width - how much to crop
    safeHeight,   // Source height
    0,            // Destination X - where to place on canvas
    0,            // Destination Y
    safeWidth,    // Destination width
    safeHeight    // Destination height
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        console.log('[Crop] Output blob size:', blob.size, 'bytes');
        const file = new File([blob], outputFileName, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      0.92 // Quality
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => {
      console.log('[Crop] Image loaded successfully:', image.naturalWidth, 'x', image.naturalHeight);
      resolve(image);
    });
    image.addEventListener('error', (error) => {
      console.error('[Crop] Image load error:', error);
      reject(error);
    });
    // Only set crossOrigin for non-blob URLs (blob URLs don't need it and it can cause issues)
    if (!url.startsWith('blob:')) {
      image.crossOrigin = 'anonymous';
    }
    image.src = url;
  });
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  aspectRatio,
  onCropComplete,
  title = 'Crop Image',
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      console.log('[Crop] onCropComplete - Percentage area:', croppedArea);
      console.log('[Crop] onCropComplete - Pixel area:', croppedAreaPixels);
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        `cropped-${Date.now()}.jpg`
      );
      onCropComplete(croppedFile);
      onOpenChange(false);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const isLogo = aspectRatio === 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg p-0 overflow-hidden bg-black"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        
        {/* Crop area */}
        <div className="relative h-[350px] w-full bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={isLogo ? 'round' : 'rect'}
            showGrid={!isLogo}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls */}
        <div className="bg-white px-4 py-4 space-y-4">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(values) => setZoom(values[0])}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Hint text */}
          <p className="text-xs text-center text-muted-foreground">
            {isLogo 
              ? 'Position your photo in the circle. Final shape will be slightly squarer.'
              : 'Position your cover photo in the frame.'
            }
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            
            <div className="flex-1" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
