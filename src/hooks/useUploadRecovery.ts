/**
 * Hook to check for and manage incomplete uploads on app start
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getAllIncompleteJobs, 
  deleteUploadJob, 
  cleanupStaleJobs,
  PersistedUploadJob 
} from '@/lib/uploadDatabase';

export interface UploadRecoveryState {
  incompleteJobs: PersistedUploadJob[];
  isLoading: boolean;
  showRecoveryModal: boolean;
}

export function useUploadRecovery(userId?: string) {
  const [state, setState] = useState<UploadRecoveryState>({
    incompleteJobs: [],
    isLoading: true,
    showRecoveryModal: false
  });

  // Check for incomplete jobs on mount
  useEffect(() => {
    const checkForIncompleteJobs = async () => {
      try {
        // First, cleanup any stale jobs
        await cleanupStaleJobs();
        
        // Then get incomplete jobs
        const jobs = await getAllIncompleteJobs();
        
        // Filter to only jobs that can be resumed (have uploaded bytes or are failed)
        const resumableJobs = jobs.filter(job => 
          job.overallStatus !== 'complete' &&
          (job.mediaItems.some(m => m.status === 'failed') || 
           job.mediaItems.some(m => m.status === 'pending') ||
           job.mediaItems.some(m => m.status === 'uploading'))
        );

        setState({
          incompleteJobs: resumableJobs,
          isLoading: false,
          showRecoveryModal: resumableJobs.length > 0
        });

        if (resumableJobs.length > 0) {
          console.log(`[UploadRecovery] Found ${resumableJobs.length} incomplete upload job(s)`);
        }
      } catch (error) {
        console.error('[UploadRecovery] Error checking for incomplete jobs:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkForIncompleteJobs();
  }, [userId]);

  const dismissRecoveryModal = useCallback(() => {
    setState(prev => ({ ...prev, showRecoveryModal: false }));
  }, []);

  const discardJob = useCallback(async (jobId: string) => {
    try {
      await deleteUploadJob(jobId);
      setState(prev => ({
        ...prev,
        incompleteJobs: prev.incompleteJobs.filter(j => j.id !== jobId),
        showRecoveryModal: prev.incompleteJobs.length > 1
      }));
      console.log(`[UploadRecovery] Discarded job: ${jobId}`);
    } catch (error) {
      console.error('[UploadRecovery] Error discarding job:', error);
    }
  }, []);

  const discardAllJobs = useCallback(async () => {
    try {
      await Promise.all(state.incompleteJobs.map(job => deleteUploadJob(job.id)));
      setState({
        incompleteJobs: [],
        isLoading: false,
        showRecoveryModal: false
      });
      console.log('[UploadRecovery] Discarded all incomplete jobs');
    } catch (error) {
      console.error('[UploadRecovery] Error discarding all jobs:', error);
    }
  }, [state.incompleteJobs]);

  const refreshJobs = useCallback(async () => {
    try {
      const jobs = await getAllIncompleteJobs();
      setState(prev => ({
        ...prev,
        incompleteJobs: jobs.filter(j => j.overallStatus !== 'complete')
      }));
    } catch (error) {
      console.error('[UploadRecovery] Error refreshing jobs:', error);
    }
  }, []);

  return {
    ...state,
    dismissRecoveryModal,
    discardJob,
    discardAllJobs,
    refreshJobs
  };
}
