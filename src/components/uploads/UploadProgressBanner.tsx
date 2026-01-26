/**
 * Persistent Upload Progress Banner
 * 
 * Shows at the top of the screen during active uploads with:
 * - File progress
 * - Upload speed
 * - ETA
 * - Pause/Resume/Cancel controls
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { formatBytes, formatDuration, formatBytesPerSecond } from '@/uploads/uploadSpeedTracker';
import { cn } from '@/lib/utils';
import type { DetailedUploadProgress } from '@/uploads/uploadProgressTypes';

interface ActiveUpload {
  jobId: string;
  status: 'uploading' | 'complete' | 'failed' | 'paused';
  currentFile: number;
  totalFiles: number;
  fileName: string;
  percentage: number;
  speed: number;
  eta: number;
  error?: string;
}

export function UploadProgressBanner() {
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    // Listen to upload events
    const handleEnqueued = (event: any) => {
      setActiveUploads(prev => {
        // Don't add if already exists
        if (prev.some(u => u.jobId === event.jobId)) return prev;
        
        return [...prev, {
          jobId: event.jobId,
          status: 'uploading',
          currentFile: 1,
          totalFiles: event.fileCount || 1,
          fileName: 'Preparing...',
          percentage: 0,
          speed: 0,
          eta: 0,
        }];
      });
    };
    
    const handleProgress = (event: any) => {
      setActiveUploads(prev => prev.map(u => {
        if (u.jobId !== event.jobId) return u;
        
        return {
          ...u,
          currentFile: event.progress?.uploadedFiles || u.currentFile,
          totalFiles: event.progress?.totalFiles || u.totalFiles,
          percentage: event.progress 
            ? Math.round((event.progress.uploadedFiles / event.progress.totalFiles) * 100)
            : u.percentage,
        };
      }));
    };
    
    const handleFileProgress = (event: any) => {
      setActiveUploads(prev => prev.map(u => {
        if (u.jobId !== event.jobId) return u;
        
        const percentage = event.bytesTotal > 0 
          ? Math.round((event.bytesUploaded / event.bytesTotal) * 100)
          : event.progress || 0;
        
        // Handle status changes (paused, preparing, etc.)
        let status = u.status;
        if (event.status === 'paused') {
          status = 'paused';
        } else if (event.status === 'preparing') {
          status = 'uploading'; // Keep as uploading but update filename
        }
        
        return {
          ...u,
          status,
          fileName: event.status === 'preparing' 
            ? `Optimizing ${event.fileName || ''}...`
            : event.fileName || u.fileName,
          percentage,
          speed: event.speed || u.speed,
          eta: event.eta || u.eta,
        };
      }));
    };
    
    const handleComplete = (event: any) => {
      setActiveUploads(prev => prev.map(u => {
        if (u.jobId !== event.jobId) return u;
        return { ...u, status: 'complete', percentage: 100 };
      }));
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setActiveUploads(prev => prev.filter(u => u.jobId !== event.jobId));
      }, 3000);
    };
    
    const handleFailed = (event: any) => {
      setActiveUploads(prev => prev.map(u => {
        if (u.jobId !== event.jobId) return u;
        return { ...u, status: 'failed', error: event.error };
      }));
    };
    
    const unsubEnqueued = uploadEventBus.on('upload:enqueued', handleEnqueued);
    const unsubProgress = uploadEventBus.on('upload:progress', handleProgress);
    const unsubComplete = uploadEventBus.on('upload:complete', handleComplete);
    const unsubFailed = uploadEventBus.on('upload:failed', handleFailed);
    
    // Also listen for file-level progress if available
    const unsubFileProgress = uploadEventBus.on('file:upload-progress', handleFileProgress);
    
    return () => {
      unsubEnqueued();
      unsubProgress();
      unsubComplete();
      unsubFailed();
      unsubFileProgress();
    };
  }, []);
  
  const handleDismiss = (jobId: string) => {
    setDismissedJobs(prev => new Set([...prev, jobId]));
    setActiveUploads(prev => prev.filter(u => u.jobId !== jobId));
  };
  
  // Filter out dismissed jobs
  const visibleUploads = activeUploads.filter(u => !dismissedJobs.has(u.jobId));
  
  if (visibleUploads.length === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[60] safe-area-top"
      >
        <div className="bg-background/95 backdrop-blur-lg border-b border-border/30 shadow-lg">
          {visibleUploads.map((upload) => (
            <UploadProgressItem
              key={upload.jobId}
              upload={upload}
              onDismiss={() => handleDismiss(upload.jobId)}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface UploadProgressItemProps {
  upload: ActiveUpload;
  onDismiss: () => void;
}

function UploadProgressItem({ upload, onDismiss }: UploadProgressItemProps) {
  const isFailed = upload.status === 'failed';
  const isComplete = upload.status === 'complete';
  const isPaused = upload.status === 'paused';
  
  return (
    <div className="px-4 py-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : isFailed ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isComplete
              ? 'Upload complete'
              : isFailed
                ? 'Upload failed'
                : `Uploading ${upload.currentFile} of ${upload.totalFiles}`}
          </span>
        </div>
        
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            isComplete ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${upload.percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Details row */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="truncate max-w-[200px]">
          {upload.fileName}
        </span>
        <div className="flex items-center gap-3">
          {upload.speed > 0 && !isComplete && !isFailed && (
            <span>{formatBytesPerSecond(upload.speed)}</span>
          )}
          {upload.eta > 0 && !isComplete && !isFailed && (
            <span>{formatDuration(upload.eta)} left</span>
          )}
          <span className="font-medium">{upload.percentage}%</span>
        </div>
      </div>
      
      {/* Error message */}
      {isFailed && upload.error && (
        <div className="mt-2">
          <span className="text-xs text-red-500">{upload.error}</span>
        </div>
      )}
    </div>
  );
}

export default UploadProgressBanner;
