import React from 'react';
import { Camera, ImageOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';

interface PermissionDeniedCardProps {
  type: 'camera' | 'photos';
  onRetry?: () => void;
}

export function PermissionDeniedCard({ type, onRetry }: PermissionDeniedCardProps) {
  const isCamera = type === 'camera';
  const Icon = isCamera ? Camera : ImageOff;
  
  const handleOpenSettings = () => {
    // On native, we can potentially open app settings
    // For now, provide instructions
    if (Capacitor.isNativePlatform()) {
      // Note: Opening settings requires @capacitor/app-launcher or native code
      // For now, we'll just show instructions
      alert(
        `To enable ${isCamera ? 'camera' : 'photo library'} access:\n\n` +
        '1. Open your device Settings\n' +
        '2. Find Clbhouz in the app list\n' +
        `3. Enable ${isCamera ? 'Camera' : 'Photos'} permission`
      );
    }
  };
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {isCamera ? 'Camera Access Needed' : 'Photo Library Access Needed'}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {isCamera 
          ? 'Allow camera access to capture photos and videos of your golf moments.'
          : 'Allow photo library access to share your golf memories.'
        }
      </p>
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenSettings}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Open Settings
        </Button>
        
        {onRetry && (
          <Button
            variant="default"
            size="sm"
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
