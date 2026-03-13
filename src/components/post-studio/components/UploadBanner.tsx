// UploadBanner — Live upload progress bar
// Card surface with amber icon + green flash on completion

import React, { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useUploadProgress } from '@/hooks/useUploadProgress';

export function UploadBanner() {
  const { isUploading, uploadedCount, totalCount } = useUploadProgress();
  const [showGreen, setShowGreen] = useState(false);
  const prevComplete = useRef(false);

  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;
  const isComplete = uploadedCount >= totalCount && totalCount > 0;

  // Green flash on completion
  useEffect(() => {
    if (isComplete && !prevComplete.current) {
      setShowGreen(true);
      const timer = setTimeout(() => setShowGreen(false), 500);
      return () => clearTimeout(timer);
    }
    prevComplete.current = isComplete;
  }, [isComplete]);

  if (!isUploading && totalCount === 0) {
    return (
      <div className="w-full bg-background rounded-2xl p-4 border border-border/40 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">Queued</p>
          <p className="text-muted-foreground text-xs">Upload will start shortly…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background rounded-2xl p-4 border border-border/40 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {isComplete ? <span className="text-lg">✅</span> : <Upload className="w-5 h-5 text-primary" />}
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-sm font-medium">{isComplete ? 'Uploaded' : 'Uploading…'}</p>
          <p className="text-muted-foreground text-xs">{uploadedCount}/{totalCount}</p>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${showGreen ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
