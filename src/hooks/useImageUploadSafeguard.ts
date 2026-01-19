import { useEffect } from 'react';
import { enforceR2OnlyPolicy } from '@/utils/r2OnlyUpload';

/**
 * Hook to enforce R2-only upload policy across the application
 * This prevents accidental Supabase storage usage for images
 */
export const useImageUploadSafeguard = () => {
  useEffect(() => {
    // Enforce R2-only policy on component mount
    enforceR2OnlyPolicy();
  }, []);

  return {
    // Helper function to remind developers about the policy
    remindR2Policy: () => {
      console.warn('📋 Reminder: Use uploadToR2Only() for all image uploads. Supabase storage is not allowed.');
    }
  };
};
