// Types for Create Moment modal components
import { ComposerMediaItem } from "@/hooks/useSnapModal";

// Moment types for category tagging (legacy - kept for backwards compatibility)
export type MomentType = 'funny' | 'challenge' | 'course-vlog' | 'tips-coaching' | 'review' | 'other';

// New category system - scalable with Discover filters
export interface MomentCategory {
  id: string;
  label: string;
  emoji: string;
}

// Visibility options for moments (matches DB enum: post_visibility)
export type MomentVisibility = 'anyone' | 'followers' | 'private';

// Taggable entity for @mentions (matches taggable_entities table)
export interface TaggableEntity {
  id: string;  // taggable_entities.id - used for post_tags.tagged_entity_id
  entity_id: string;  // the underlying entity ID (user_id or business_id)
  entity_type: 'user' | 'business';
  name: string;
  username: string | null;
  avatar_url?: string;
}

export interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

// Actor reference for overrides
export interface ActorRef {
  type: 'personal' | 'business';
  id: string;
}

export interface CreateMomentProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems?: ComposerMediaItem[];
  selectedCourse?: GolfCourse | null;
  onCourseSelect?: (course: GolfCourse | null) => void;
  onMediaChange?: (items: ComposerMediaItem[]) => void;
  /** One-time actor override - applies on mount without persisting to localStorage */
  initialActorOverride?: ActorRef;
}

export interface CreateMomentSubmitData {
  caption: string;
  files: File[];
  mediaItems: ComposerMediaItem[];
  selectedCourse: GolfCourse | null;
  visibility: "public" | "private";
  isPrivate: boolean;
  backgroundMusic: null;
  coverIndex: number;
  studioEditsByMediaId: Record<string, { filter: string }>;
  momentType?: MomentType;
}

// Extended media item with order for reordering
export interface OrderedMediaItem extends ComposerMediaItem {
  order: number;
}

// Draft state for localStorage persistence
export interface CreateMomentDraft {
  caption: string;
  actorType: 'personal' | 'business';
  actorId?: string;
  courseId?: string;
  courseName?: string;
  courseCountry?: string;
  visibility: "public" | "private";
  savedAt: number;
  momentType?: MomentType;
}

// Upload progress state
export interface UploadProgressState {
  status: 'idle' | 'uploading' | 'success' | 'failed';
  uploadedFiles: number;
  totalFiles: number;
  error?: string;
}
