import React, { useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, Aperture } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isNativePlatform, openNativeCamera } from '@/utils/capacitor';
import type { ComposerMediaItem } from '@/hooks/useSnapModal';

interface CameraCaptureProps {
  onCapture: (item: ComposerMediaItem) => void;
  onPermissionDenied: () => void;
  disabled?: boolean;
}

export function CameraCapture({
  onCapture,
  onPermissionDenied,
  disabled,
}: CameraCaptureProps) {
  // Auto-launch camera on native when this view is shown
  const launchCamera = useCallback(async () => {
    if (!isNativePlatform()) {
      // Web fallback - use input capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.capture = 'environment';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const previewUrl = URL.createObjectURL(file);
          const item: ComposerMediaItem = {
            id: crypto.randomUUID?.() ?? `${Date.now()}`,
            type: file.type.startsWith('video') ? 'video' : 'image',
            file,
            previewUrl,
            thumbnailUrl: file.type.startsWith('video') ? undefined : previewUrl,
          };
          onCapture(item);
        }
      };
      
      input.click();
      return;
    }
    
    const result = await openNativeCamera();
    
    if (result.permissionDenied) {
      onPermissionDenied();
      return;
    }
    
    if (result.success && result.items.length > 0) {
      onCapture(result.items[0]);
    }
  }, [onCapture, onPermissionDenied]);
  
  // Auto-launch on mount
  useEffect(() => {
    if (!disabled) {
      launchCamera();
    }
  }, [disabled, launchCamera]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-black">
      {/* Camera viewfinder placeholder */}
      <div className="relative w-full aspect-[3/4] bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Camera launching...</p>
        </div>
        
        {/* Viewfinder grid overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Camera controls */}
      <div className="flex items-center justify-center gap-8 py-6 bg-black w-full">
        <button
          type="button"
          className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white"
          disabled
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
        
        <Button
          size="lg"
          onClick={launchCamera}
          disabled={disabled}
          className="w-16 h-16 rounded-full bg-white hover:bg-zinc-100 text-black p-0"
        >
          <Aperture className="w-8 h-8" />
        </Button>
        
        <div className="w-12 h-12" /> {/* Spacer for symmetry */}
      </div>
    </div>
  );
}
