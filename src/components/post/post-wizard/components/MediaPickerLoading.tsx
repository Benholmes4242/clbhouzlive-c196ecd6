import React from 'react';
import { Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { canAccessGalleryDirectly } from '@/utils/capacitor/galleryService';

interface MediaPickerLoadingProps {
  message?: string;
}

export function MediaPickerLoading({ message = 'Loading your media...' }: MediaPickerLoadingProps) {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const canAccessGallery = canAccessGalleryDirectly();
  
  return (
    <div className="h-full flex flex-col bg-background min-h-[300px] animate-in fade-in duration-200">
      {/* DEBUG PANEL - REMOVE AFTER TESTING */}
      <div className="bg-red-600 text-white p-3 text-xs font-mono overflow-auto max-h-40 z-[100] flex-shrink-0">
        <div className="font-bold mb-1">🔧 DEBUG - MediaPickerLoading:</div>
        <div>Platform: {platform}</div>
        <div>isNativePlatform: {String(isNative)}</div>
        <div>canAccessGalleryDirectly: {String(canAccessGallery)}</div>
        <div>Message: {message}</div>
        <div className="mt-1 text-red-200 text-[10px]">
          ⚠️ If canAccessGalleryDirectly is FALSE on native, the custom gallery won't load!
        </div>
      </div>
      
      {/* Original loading content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary/20 animate-ping" />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {message}
        </p>
      </div>
    </div>
  );
}
