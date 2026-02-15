import React from 'react';
import { Camera, ImageOff, Settings } from 'lucide-react';
import { isMedianApp } from '@/utils/median/isMedianApp';

interface PermissionDeniedCardProps {
  type: 'camera' | 'photos';
  onRetry?: () => void;
}

export function PermissionDeniedCard({ type, onRetry }: PermissionDeniedCardProps) {
  const isCamera = type === 'camera';
  const Icon = isCamera ? Camera : ImageOff;
  
  const handleOpenSettings = () => {
    if (isMedianApp()) {
      alert(
        `To enable ${isCamera ? 'camera' : 'photo library'} access:\n\n` +
        '1. Open your device Settings\n' +
        '2. Find Clbhouz in the app list\n' +
        `3. Enable ${isCamera ? 'Camera' : 'Photos'} permission`
      );
    }
  };
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isCamera ? 'Camera Access Needed' : 'Photo Library Access Needed'}
      </h3>
      
      <p className="text-sm text-gray-500 mb-8 max-w-xs">
        {isCamera 
          ? 'Allow camera access to capture photos and videos of your golf moments.'
          : 'Allow photo library access to share your golf memories.'
        }
      </p>
      
      <div className="flex flex-col items-center gap-3 w-full max-w-[220px]">
        <button
          onClick={handleOpenSettings}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white rounded-full px-6 py-3 font-medium active:scale-[0.97] transition-transform"
        >
          <Settings className="w-4 h-4" />
          Open Settings
        </button>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-amber-600 font-medium text-sm active:opacity-70 transition-opacity"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}