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
import { matchPath } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { formatDuration } from '@/uploads/uploadSpeedTracker';
import { retryJob, cancelJob, retryFailedItems } from '@/uploads/uploadPipeline';
import { usePendingPostsStore } from '@/uploads/pendingPostsStore';

// Routes that render PendingPostCard inline. The banner is suppressed for
// post-type uploads on these routes so progress isn't double-shown (card +
// banner). The banner still appears on every other surface as a global
// fallback, and review uploads still surface here everywhere.
const PENDING_CARD_ROUTE_PATTERNS = [
  '/profile',
  '/profile/:username',
  '/business/:idOrSlug',
];

function routeRendersPendingCards(pathname: string): boolean {
  return PENDING_CARD_ROUTE_PATTERNS.some((p) => matchPath({ path: p, end: true }, pathname));
}

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
    
    // The job leaves the bar the moment it completes; the glass toast from
    // UploadToastsBridge is the only confirmation.
    const handleComplete = (event: any) => {
      setActiveUploads(prev => prev.filter(u => u.jobId !== event.jobId));
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
  
  // Suppress post-type uploads on routes that render a PendingPostCard
  // (profile + business profile + watch/videos). Review uploads still
  // surface everywhere as they have no in-feed equivalent.
  //
  // UploadProgressBanner mounts ABOVE BrowserRouter, so useLocation() is
  // unavailable. Read pathname directly and keep it fresh via popstate +
  // a light interval for SPA pushState navigations.
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  useEffect(() => {
    const update = () => {
      const next = window.location.pathname;
      setPathname((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('popstate', update);
    const id = window.setInterval(update, 1000);
    return () => {
      window.removeEventListener('popstate', update);
      window.clearInterval(id);
    };
  }, []);
  const suppressPostUploads = routeRendersPendingCards(pathname);
  const byJobId = usePendingPostsStore((s) => s.byJobId);
  const pendingPostJobIds = React.useMemo(
    () => Object.keys(byJobId),
    [byJobId]
  );

  const visibleUploads = activeUploads.filter((u) => {
    if (dismissedJobs.has(u.jobId)) return false;
    if (
      suppressPostUploads &&
      u.uploadType !== 'review' &&
      pendingPostJobIds.includes(u.jobId)
    ) {
      return false;
    }
    return true;
  });
  if (visibleUploads.length === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed z-[60] flex flex-col"
        style={{ bottom: '97px', left: 12, right: 12, gap: 8 }}
      >
        {visibleUploads.map((upload) => (
          <UploadProgressItem
            key={upload.jobId}
            upload={upload}
            onDismiss={() => handleDismiss(upload.jobId)}
            onRetry={() => handleRetry(upload.jobId)}
            onCancel={() => handleCancel(upload.jobId)}
          />
        ))}
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
  const isUploading = upload.status === 'uploading' || upload.status === 'paused';
  const isPartialFailure = upload.status === 'partial_failure';
  const canRetry = upload.hasFiles !== false;

  if (isFailed || isPartialFailure) {
    const title = isPartialFailure ? `${upload.completedFiles} of ${upload.totalFiles} uploaded` : 'Upload failed';
    const desc = isPartialFailure
      ? (canRetry
        ? `${upload.failedFiles} file${(upload.failedFiles || 0) !== 1 ? 's' : ''} failed — tap Retry to try again`
        : 'Upload interrupted — please create the post again')
      : (!canRetry ? 'Upload interrupted — please create the post again' : upload.error);
    return (
      <div className="glass-tile" data-testid="upload-tile" data-state={upload.status}>
        <span className="glass-tile-icon"><AlertCircle size={17} strokeWidth={1.9} /></span>
        <span className="glass-tile-text">
          <span className="glass-tile-title">{title}</span>
          {desc && <span className="glass-tile-desc">{desc}</span>}
        </span>
        {canRetry && <button type="button" className="glass-tile-action" onClick={onRetry}>Retry</button>}
        {/* Partial failure keeps its existing Discard (cancel) behaviour under Dismiss. */}
        <button type="button" className="glass-tile-cancel" onClick={isPartialFailure ? onCancel : onDismiss}>Dismiss</button>
      </div>
    );
  }

  const eta = isUploading && upload.eta > 0 ? ` · ${formatDuration(upload.eta)} left` : '';
  return (
    <div className="glass-tile" data-testid="upload-tile" data-state={upload.status}>
      <span className="glass-tile-icon"><span className="glass-spin" aria-hidden /></span>
      <span className="glass-tile-text">
        <span className="glass-tile-title">{upload.uploadType === 'review' ? 'Posting your review' : 'Posting'}</span>
        <span className="glass-tile-desc">{`${upload.currentFile} of ${upload.totalFiles}${eta}`}</span>
      </span>
      <button type="button" className="glass-tile-cancel" onClick={onCancel} aria-label="Cancel upload">Cancel</button>
      <span className="glass-tile-bar" aria-hidden><i style={{ width: `${upload.percentage}%` }} /></span>
    </div>
  );
}

export default UploadProgressBanner;
