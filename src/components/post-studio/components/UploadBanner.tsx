// UploadBanner — Live upload progress bar
// Reads from uploadEventBus via useUploadProgress

import React from 'react';
import { useUploadProgress } from '@/hooks/useUploadProgress';

export function UploadBanner() {
  const { isUploading, uploadedCount, totalCount } = useUploadProgress();

  if (!isUploading && totalCount === 0) {
    return (
      <div className="w-full bg-muted rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0">
          <span className="text-lg">📤</span>
        </div>
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">Queued</p>
          <p className="text-muted-foreground text-xs">Upload will start shortly…</p>
        </div>
      </div>
    );
  }

  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;
  const isComplete = uploadedCount >= totalCount && totalCount > 0;

  return (
    <div className="w-full bg-muted rounded-xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0">
        <span className="text-lg">{isComplete ? '✅' : '📤'}</span>
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-sm font-medium">
            {isComplete ? 'Uploaded' : 'Uploading…'}
          </p>
          <p className="text-muted-foreground text-xs">
            {uploadedCount}/{totalCount}
          </p>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
