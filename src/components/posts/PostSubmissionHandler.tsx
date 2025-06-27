
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { usePostDeletion } from '@/hooks/usePostDeletion';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostSubmissionHandlerProps {
  user: any;
  content: string;
  mediaFiles: File[];
  selectedTags: TaggableEntity[];
  onSuccess: () => void;
  onError: () => void;
}

// Export the hooks for use in components
export { usePostSubmission, usePostDeletion };
