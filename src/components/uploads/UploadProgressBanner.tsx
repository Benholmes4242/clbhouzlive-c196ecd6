/**
 * Persistent Upload Progress Banner
 * 
 * Shows at the top of the screen during active uploads with:
 * - File progress, upload speed, ETA
 * - Retry button for failed uploads
 * - Cancel button for in-progress uploads
 * - Partial failure recovery with "Retry failed" and "Discard"
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Loader2, Star, RotateCcw, AlertTriangle } from 'lucide-react';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { formatBytes, formatDuration, formatBytesPerSecond } from '@/uploads/uploadSpeedTracker';
import { retryJob, cancelJob, retryFailedItems } from '@/uploads/uploadPipeline';
import { cn } from '@/lib/utils';

interface ActiveUpload {
  jobId: string;
  uploadType: 'post' | 'review';
  status: 'uploading' | 'complete' | 'failed' | 'paused' | 'partial_failure';
  currentFile: number;
  totalFiles: number;
  fileName: string;
  percentage: number;
  speed: number;
  eta: number;
  error?: string;
  hasFiles?: boolean; // Whether File objects are still in memory
  // Partial failure details
  completedFiles?: number;
  failedFiles?: number;
  metadata?: {
    courseName?: string;
  };
}

export function UploadProgressBanner() {
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const handleEnqueued = (event: any) => {
      setActiveUploads(prev => {
        if (prev.some(u => u.jobId === event.jobId)) return prev;
        const uploadType = event.uploadType || 'post';
        const displayText = uploadType === 'review'
          ? `Review: ${event.metadata?.courseName || 'Course'}`
          : 'Preparing...';
        return [...prev, {
          jobId: event.jobId,
          uploadType,
          status: 'uploading',
          currentFile: 1,
          totalFiles: event.fileCount || 1,
          fileName: displayText,
          percentage: 0,
          speed: 0,
          eta: 0,
          hasFiles: true,
          metadata: event.metadata,
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
        let status = u.status;
        if (event.status === 'paused') status = 'paused';
        else if (event.status === 'preparing') status = 'uploading';
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

    const handlePartialFailure = (event: any) => {
      setActiveUploads(prev => prev.map(u => {
        if (u.jobId !== event.jobId) return u;
        return {
          ...u,
          status: 'partial_failure' as const,
          completedFiles: event.completedFiles,
          failedFiles: event.failedFiles,
          totalFiles: event.totalFiles,
          percentage: Math.round((event.completedFiles / event.totalFiles) * 100),
        };
      }));
    };
    
    const unsubEnqueued = uploadEventBus.on('upload:enqueued', handleEnqueued);
    const unsubProgress = uploadEventBus.on('upload:progress', handleProgress);
    const unsubComplete = uploadEventBus.on('upload:complete', handleComplete);
    const unsubFailed = uploadEventBus.on('upload:failed', handleFailed);
    const unsubFileProgress = uploadEventBus.on('file:upload-progress', handleFileProgress);
    const unsubPartialFailure = uploadEventBus.on('upload:partial-failure', handlePartialFailure);

    // Handle foregrounded after long background — show reconnecting status
    const handleForegrounded = (event: any) => {
      if (event.connectionMayBeStale) {
        setActiveUploads(prev => prev.map(u => {
          if (u.status !== 'uploading') return u;
          return { ...u, fileName: 'Reconnecting...' };
        }));
        setTimeout(() => {
          setActiveUploads(prev => prev.map(u => {
            if (u.fileName !== 'Reconnecting...') return u;
            return { ...u, fileName: 'Uploading...' };
          }));
        }, 3000);
      }
    };
    const unsubForegrounded = uploadEventBus.on('upload:foregrounded', handleForegrounded);
    
    return () => {
      unsubEnqueued();
      unsubProgress();
      unsubComplete();
      unsubFailed();
      unsubFileProgress();
      unsubPartialFailure();
      unsubForegrounded();
    };
  }, []);
  
  const handleDismiss = (jobId: string) => {
    setDismissedJobs(prev => new Set([...prev, jobId]));
    setActiveUploads(prev => prev.filter(u => u.jobId !== jobId));
  };

  const handleRetry = async (jobId: string) => {
    const upload = activeUploads.find(u => u.jobId === jobId);

    if (upload?.status === 'partial_failure') {
      // Retry only failed items
      setActiveUploads(prev => prev.map(u =>
        u.jobId === jobId ? { ...u, status: 'uploading' as const } : u
      ));
      await retryFailedItems(jobId);
    } else {
      // Full retry (existing behavior)
      const success = retryJob(jobId);
      if (success) {
        setActiveUploads(prev => prev.map(u => 
          u.jobId === jobId ? { ...u, status: 'uploading' as const, percentage: 0, error: undefined } : u
        ));
      }
    }
  };

  const handleCancel = async (jobId: string) => {
    await cancelJob(jobId);
    setActiveUploads(prev => prev.filter(u => u.jobId !== jobId));
  };
  
  const visibleUploads = activeUploads.filter(u => !dismissedJobs.has(u.jobId));
  if (visibleUploads.length === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed left-0 right-0 z-[60] px-3"
        style={{ bottom: "109px" }}
      >
        <div className="bg-background/95 backdrop-blur-lg border border-border/30 shadow-lg rounded-2xl overflow-hidden">
          {visibleUploads.map((upload) => (
            <UploadProgressItem
              key={upload.jobId}
              upload={upload}
              onDismiss={() => handleDismiss(upload.jobId)}
              onRetry={() => handleRetry(upload.jobId)}
              onCancel={() => handleCancel(upload.jobId)}
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
  onRetry: () => void;
  onCancel: () => void;
}

function UploadProgressItem({ upload, onDismiss, onRetry, onCancel }: UploadProgressItemProps) {
  const isFailed = upload.status === 'failed';
  const isComplete = upload.status === 'complete';
  const isUploading = upload.status === 'uploading' || upload.status === 'paused';
  const isPartialFailure = upload.status === 'partial_failure';
  
  return (
    <div className="px-4 py-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : isPartialFailure ? (
            <AlertTriangle className="h-4 w-4 text-primary" />
          ) : isFailed ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : upload.uploadType === 'review' ? (
            <Star className="h-4 w-4 text-primary animate-pulse" />
          ) : (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isComplete
              ? 'Upload complete'
              : isPartialFailure
                ? `${upload.completedFiles} of ${upload.totalFiles} uploaded`
                : isFailed
                  ? 'Upload failed'
                  : `Uploading ${upload.currentFile} of ${upload.totalFiles}`}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Cancel button — visible during active upload */}
          {isUploading && (
            <button
              onClick={onCancel}
              className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              aria-label="Cancel upload"
            >
              Cancel
            </button>
          )}

          {/* Partial failure actions */}
          {isPartialFailure && (
            upload.hasFiles !== false ? (
              <>
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry failed
                </button>
                <button
                  onClick={onCancel}
                  className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Discard
                </button>
              </>
            ) : (
              <button
                onClick={onCancel}
                className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Dismiss
              </button>
            )
          )}

          {/* Retry button — visible on failure if files are still available */}
          {isFailed && upload.hasFiles !== false && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      {isPartialFailure ? (
        // Split progress bar: green for completed, red for failed
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden flex">
          <motion.div
            className="bg-green-500 rounded-l-full"
            initial={{ width: 0 }}
            animate={{ width: `${((upload.completedFiles || 0) / (upload.totalFiles || 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="bg-destructive"
            initial={{ width: 0 }}
            animate={{ width: `${((upload.failedFiles || 0) / (upload.totalFiles || 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      ) : (
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              isComplete ? "bg-green-500" : isFailed ? "bg-destructive" : "bg-primary"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${upload.percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
      
      {/* Details row */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="truncate max-w-[200px]">
        {isPartialFailure
            ? (upload.hasFiles !== false
              ? `${upload.failedFiles} file${(upload.failedFiles || 0) !== 1 ? 's' : ''} failed — tap Retry to try again`
              : 'Upload interrupted — please create the post again')
            : upload.fileName}
        </span>
        <div className="flex items-center gap-3">
          {upload.speed > 0 && !isComplete && !isFailed && !isPartialFailure && (
            <span>{formatBytesPerSecond(upload.speed)}</span>
          )}
          {upload.eta > 0 && !isComplete && !isFailed && !isPartialFailure && (
            <span>{formatDuration(upload.eta)} left</span>
          )}
          {!isPartialFailure && (
            <span className="font-medium">{upload.percentage}%</span>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {isFailed && upload.error && (
        <div className="mt-2">
          <span className="text-xs text-destructive">
            {upload.hasFiles === false
              ? 'Upload interrupted — please create the post again'
              : upload.error}
          </span>
        </div>
      )}
    </div>
  );
}

export default UploadProgressBanner;
