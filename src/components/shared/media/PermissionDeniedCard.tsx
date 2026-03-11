// PermissionDeniedCard — Shown when camera/photo permissions are denied
import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface PermissionDeniedCardProps {
  type: 'camera' | 'photos';
  onRetry: () => void;
}

export function PermissionDeniedCard({ type, onRetry }: PermissionDeniedCardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldAlert className="w-7 h-7 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {type === 'camera' ? 'Camera access denied' : 'Photo access denied'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Please enable {type} access in your device settings
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium min-h-[44px]"
      >
        Try again
      </button>
    </div>
  );
}
