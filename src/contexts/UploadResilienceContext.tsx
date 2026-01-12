/**
 * Global context for upload resilience
 * Manages recovery modal, progress indicator, and resilient upload state
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useUploadRecovery } from '@/hooks/useUploadRecovery';
import { useResilientUpload, UploadJobProgress } from '@/hooks/useResilientUpload';
import { UploadRecoveryModal } from '@/components/upload/UploadRecoveryModal';
import { UploadProgressIndicator } from '@/components/upload/UploadProgressIndicator';
import { PersistedUploadJob, deleteUploadJob } from '@/lib/uploadDatabase';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

interface UploadResilienceContextValue {
  // Start a new resilient upload
  startResilientUpload: (params: {
    postId: string;
    mediaFiles: File[];
    postData: {
      content: string;
      actorType: string;
      actorId: string;
      visibility: string;
      categories: string[];
      badges: string[];
      courseId?: string;
      courseName?: string;
      scheduledAt?: string;
      studioEditsByIndex?: (Record<string, any> | null)[];
    };
    onComplete?: () => void;
    onError?: (error: string) => void;
  }) => Promise<string>;
  
  // Active upload jobs
  activeJobs: UploadJobProgress[];
  
  // Is online
  isOnline: boolean;
  
  // Pause/resume/cancel
  pauseUpload: (jobId: string) => void;
  cancelUpload: (jobId: string) => void;
  retryFailedUpload: (jobId: string, files: File[]) => void;
}

const UploadResilienceContext = createContext<UploadResilienceContextValue | null>(null);

export function UploadResilienceProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabaseSession();
  
  // Recovery state (checks IndexedDB on mount)
  const {
    incompleteJobs,
    showRecoveryModal,
    dismissRecoveryModal,
    discardJob,
    discardAllJobs,
    refreshJobs
  } = useUploadRecovery(user?.id);
  
  // Resilient upload hooks
  const {
    startUpload,
    resumeUpload,
    pauseUpload,
    cancelUpload,
    retryFailedFiles,
    activeJobs,
    isOnline
  } = useResilientUpload();
  
  // Track files for recovery (stored temporarily when user initiates upload)
  const [pendingResumeFiles, setPendingResumeFiles] = useState<Map<string, File[]>>(new Map());

  // Handle resume from recovery modal
  const handleResumeJob = useCallback(async (job: PersistedUploadJob) => {
    // For now, we can't truly resume without the original files
    // We'll show a message asking user to re-select files
    // In a full implementation with TUS, videos could be resumed
    
    toast.info('Please re-select your media files to continue the upload', {
      description: 'The original files are no longer accessible',
      duration: 5000
    });
    
    // For now, discard the job since we can't resume without files
    // A more complete implementation would use TUS resumable URLs for videos
    await discardJob(job.id);
  }, [discardJob]);

  // Wrapped start function that includes userId
  const startResilientUpload = useCallback(async ({
    postId,
    mediaFiles,
    postData,
    onComplete,
    onError
  }: {
    postId: string;
    mediaFiles: File[];
    postData: {
      content: string;
      actorType: string;
      actorId: string;
      visibility: string;
      categories: string[];
      badges: string[];
      courseId?: string;
      courseName?: string;
      scheduledAt?: string;
      studioEditsByIndex?: (Record<string, any> | null)[];
    };
    onComplete?: () => void;
    onError?: (error: string) => void;
  }): Promise<string> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const jobId = await startUpload({
      postId,
      mediaFiles,
      userId: user.id,
      postData,
      studioEditsByIndex: postData.studioEditsByIndex,
      onComplete,
      onError
    });

    // Store files for potential retry
    setPendingResumeFiles(prev => new Map(prev.set(jobId, mediaFiles)));

    return jobId;
  }, [user?.id, startUpload]);

  const handleRetryFailedUpload = useCallback((jobId: string, files: File[]) => {
    retryFailedFiles(jobId, files);
  }, [retryFailedFiles]);

  const handleCancelUpload = useCallback(async (jobId: string) => {
    await cancelUpload(jobId);
    setPendingResumeFiles(prev => {
      const next = new Map(prev);
      next.delete(jobId);
      return next;
    });
  }, [cancelUpload]);

  // Context value
  const value: UploadResilienceContextValue = {
    startResilientUpload,
    activeJobs,
    isOnline,
    pauseUpload,
    cancelUpload: handleCancelUpload,
    retryFailedUpload: handleRetryFailedUpload
  };

  return (
    <UploadResilienceContext.Provider value={value}>
      {children}
      
      {/* Recovery modal - shown on app start if incomplete jobs exist */}
      <UploadRecoveryModal
        open={showRecoveryModal}
        onOpenChange={dismissRecoveryModal}
        jobs={incompleteJobs}
        onResumeJob={handleResumeJob}
        onDiscardJob={discardJob}
        onDiscardAll={discardAllJobs}
      />
      
      {/* Global progress indicator */}
      <UploadProgressIndicator
        jobs={activeJobs}
        onPause={pauseUpload}
        onResume={(jobId) => {
          const files = pendingResumeFiles.get(jobId);
          if (files) {
            resumeUpload(jobId, files);
          }
        }}
        onCancel={handleCancelUpload}
        onRetry={(jobId) => {
          const files = pendingResumeFiles.get(jobId);
          if (files) {
            retryFailedFiles(jobId, files);
          }
        }}
      />
    </UploadResilienceContext.Provider>
  );
}

export function useUploadResilience() {
  const context = useContext(UploadResilienceContext);
  if (!context) {
    throw new Error('useUploadResilience must be used within UploadResilienceProvider');
  }
  return context;
}
