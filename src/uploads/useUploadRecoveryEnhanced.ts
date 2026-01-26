/**
 * Upload Recovery Hook
 * 
 * Checks for and manages incomplete uploads on app restart.
 * Shows recovery prompt if interrupted uploads are found.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  getAllIncompleteJobs, 
  deleteUploadJob, 
  cleanupStaleJobs,
  PersistedUploadJob 
} from '@/lib/uploadDatabase';
import { waitForOnline } from './networkStatus';

export interface UploadRecoveryState {
  incompleteJobs: PersistedUploadJob[];
  isLoading: boolean;
  showRecoveryModal: boolean;
}

/**
 * Hook to check for and manage incomplete uploads on app start
 */
export function useUploadRecoveryEnhanced(userId?: string) {
  const [state, setState] = useState<UploadRecoveryState>({
    incompleteJobs: [],
    isLoading: true,
    showRecoveryModal: false
  });

  // Check for incomplete jobs on mount
  useEffect(() => {
    const checkForIncompleteJobs = async () => {
      try {
        // First, cleanup any stale jobs (older than 7 days)
        await cleanupStaleJobs();
        
        // Then get incomplete jobs
        const jobs = await getAllIncompleteJobs();
        
        // Filter to only jobs that can potentially be resumed
        // Note: Video uploads with TUS can be resumed, others cannot
        const resumableJobs = jobs.filter(job => {
          // Skip completed jobs
          if (job.overallStatus === 'complete') return false;
          
          // Skip scheduled posts - they're not "unfinished" uploads
          if (job.postData.scheduledAt) return false;
          
          // Check if any media items are pending/uploading/failed
          const hasActionableMedia = job.mediaItems.some(m => 
            m.status === 'failed' || 
            m.status === 'pending' || 
            m.status === 'uploading'
          );
          
          return hasActionableMedia;
        });

        setState({
          incompleteJobs: resumableJobs,
          isLoading: false,
          showRecoveryModal: resumableJobs.length > 0
        });

        // Show toast notification if there are incomplete uploads
        if (resumableJobs.length > 0) {
          console.log(`[UploadRecovery] Found ${resumableJobs.length} incomplete upload(s)`);
          
          // Show a non-blocking toast
          toast.info(
            `You have ${resumableJobs.length} incomplete upload${resumableJobs.length > 1 ? 's' : ''}`,
            {
              action: {
                label: 'View',
                onClick: () => {
                  setState(prev => ({ ...prev, showRecoveryModal: true }));
                },
              },
              duration: 10000,
            }
          );
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
      toast.success('Upload discarded');
    } catch (error) {
      console.error('[UploadRecovery] Error discarding job:', error);
      toast.error('Failed to discard upload');
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
      toast.success('All incomplete uploads discarded');
    } catch (error) {
      console.error('[UploadRecovery] Error discarding all jobs:', error);
      toast.error('Failed to discard uploads');
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

/**
 * Utility to check if we should auto-resume uploads on startup
 */
export async function shouldAutoResumeUploads(): Promise<boolean> {
  try {
    // Wait for online status
    if (!navigator.onLine) {
      await waitForOnline();
    }
    
    const jobs = await getAllIncompleteJobs();
    
    // Only auto-resume if there are jobs that have TUS URLs (can actually be resumed)
    return jobs.some(job => 
      job.mediaItems.some(m => m.uploadUrl && m.status === 'uploading')
    );
  } catch {
    return false;
  }
}
