// Legacy re-exports — all post creation now handled by PostStudio
import { usePostDeletion } from '@/hooks/usePostDeletion';

// Re-export types for backward compatibility
export type { TaggableEntity, PostSubmissionParams } from '@/hooks/usePostSubmission/types';

export { usePostDeletion };
