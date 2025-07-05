
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { usePostDeletion } from '@/hooks/usePostDeletion';

// Re-export types for backward compatibility
export type { TaggableEntity, PostSubmissionParams } from '@/hooks/usePostSubmission/types';

interface PostSubmissionHandlerProps {
  user: any;
  content: string;
  mediaFiles: File[];
  selectedTags: any[];
  onSuccess: () => void;
  onError: () => void;
}

// Export the hooks for use in components
export { useOptimisticPostSubmission, usePostDeletion };
