import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import type { MediaUploadStatus } from '@/hooks/useSnapModal';

export interface UploadProgressState {
  /** Whether upload is currently in progress */
  isUploading: boolean;
  /** Current job ID being tracked */
  jobId: string | null;
  /** Number of files uploaded */
  uploadedCount: number;
  /** Total number of files */
  totalCount: number;
  /** Per-file upload status map (fileId -> status) */
  fileStatuses: Map<string, { status: MediaUploadStatus; progress?: number }>;
}

/**
 * Hook to track upload progress for the Create Moment modal
 * Subscribes to uploadEventBus events and provides real-time status
 */
export function useUploadProgress() {
  const [state, setState] = useState<UploadProgressState>({
    isUploading: false,
    jobId: null,
    uploadedCount: 0,
    totalCount: 0,
    fileStatuses: new Map(),
  });

  // Track if we're currently tracking a job
  const isTracking = useRef(false);

  /**
   * Start tracking a new upload job
   */
  const startTracking = useCallback((jobId: string, totalFiles: number, fileIds: string[]) => {
    isTracking.current = true;
    
    // Initialize all files as pending
    const initialStatuses = new Map<string, { status: MediaUploadStatus; progress?: number }>();
    fileIds.forEach(id => {
      initialStatuses.set(id, { status: 'pending' });
    });
    
    setState({
      isUploading: true,
      jobId,
      uploadedCount: 0,
      totalCount: totalFiles,
      fileStatuses: initialStatuses,
    });
  }, []);

  /**
   * Stop tracking (cleanup)
   */
  const stopTracking = useCallback(() => {
    isTracking.current = false;
    setState({
      isUploading: false,
      jobId: null,
      uploadedCount: 0,
      totalCount: 0,
      fileStatuses: new Map(),
    });
  }, []);

  /**
   * Get upload status for a specific file
   */
  const getFileStatus = useCallback((fileId: string): MediaUploadStatus | undefined => {
    return state.fileStatuses.get(fileId)?.status;
  }, [state.fileStatuses]);

  /**
   * Get upload progress for a specific file
   */
  const getFileProgress = useCallback((fileId: string): number | undefined => {
    return state.fileStatuses.get(fileId)?.progress;
  }, [state.fileStatuses]);

  // Subscribe to upload events
  useEffect(() => {
    // File upload start
    const unsubStart = uploadEventBus.on('file:upload-start', (event) => {
      if (!isTracking.current || event.jobId !== state.jobId) return;
      
      setState(prev => {
        const newStatuses = new Map(prev.fileStatuses);
        newStatuses.set(event.fileId, { status: 'uploading' });
        return { ...prev, fileStatuses: newStatuses };
      });
    });

    // File upload progress (for chunked uploads)
    const unsubProgress = uploadEventBus.on('file:upload-progress', (event) => {
      if (!isTracking.current || event.jobId !== state.jobId) return;
      
      setState(prev => {
        const newStatuses = new Map(prev.fileStatuses);
        newStatuses.set(event.fileId, { status: 'uploading', progress: event.progress });
        return { ...prev, fileStatuses: newStatuses };
      });
    });

    // File upload complete
    const unsubComplete = uploadEventBus.on('file:upload-complete', (event) => {
      if (!isTracking.current || event.jobId !== state.jobId) return;
      
      setState(prev => {
        const newStatuses = new Map(prev.fileStatuses);
        newStatuses.set(event.fileId, { status: 'complete' });
        
        // Count completed files
        let completedCount = 0;
        newStatuses.forEach(s => {
          if (s.status === 'complete') completedCount++;
        });
        
        return { 
          ...prev, 
          fileStatuses: newStatuses,
          uploadedCount: completedCount,
        };
      });
    });

    // File upload failed
    const unsubFailed = uploadEventBus.on('file:upload-failed', (event) => {
      if (!isTracking.current || event.jobId !== state.jobId) return;
      
      setState(prev => {
        const newStatuses = new Map(prev.fileStatuses);
        newStatuses.set(event.fileId, { status: 'failed' });
        return { ...prev, fileStatuses: newStatuses };
      });
    });

    // Job complete
    const unsubJobComplete = uploadEventBus.on('upload:complete', (event) => {
      if (!isTracking.current || event.jobId !== state.jobId) return;
      
      // Mark all remaining as complete and stop tracking after short delay
      setState(prev => {
        const newStatuses = new Map(prev.fileStatuses);
        newStatuses.forEach((value, key) => {
          if (value.status !== 'failed') {
            newStatuses.set(key, { status: 'complete' });
          }
        });
        return { 
          ...prev, 
          fileStatuses: newStatuses,
          uploadedCount: prev.totalCount,
        };
      });
      
      // Keep showing success state briefly before clearing
      setTimeout(() => {
        stopTracking();
      }, 1000);
    });

    // Job failed
    const unsubJobFailed = uploadEventBus.on('upload:failed', (event) => {
      if (!isTracking.current || event.jobId !== state.jobId) return;
      
      // Stop tracking on job failure
      stopTracking();
    });

    return () => {
      unsubStart();
      unsubProgress();
      unsubComplete();
      unsubFailed();
      unsubJobComplete();
      unsubJobFailed();
    };
  }, [state.jobId, stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    getFileStatus,
    getFileProgress,
  };
}
