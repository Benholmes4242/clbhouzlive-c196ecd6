// Post Wizard Types - Foundation for multi-step post creation
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { TaggableEntity, GolfCourse, MomentVisibility, MomentCategory } from "../create-moment/types";
import { StudioEdits } from "@/types/studio";

// Re-export StudioEdits for convenience
export type { StudioEdits };

// Wizard step identifiers
export type PostWizardStep = 'media' | 'caption' | 'confirm';

// Actor reference for personal vs business posting
export interface ActorRef {
  type: 'personal' | 'business';
  id: string;
}

// Media item with order for reordering
export interface OrderedMediaItem extends ComposerMediaItem {
  order: number;
}

// Complete wizard state
export interface PostWizardState {
  // Navigation
  currentStep: PostWizardStep;
  
  // Media
  mediaItems: OrderedMediaItem[];
  coverIndex: number;
  studioEditsByMediaId: Record<string, StudioEdits>;
  activeMediaId: string | null; // For studio editing
  
  // Caption & Details
  caption: string;
  selectedTags: TaggableEntity[];
  selectedCourses: GolfCourse[]; // Multi-course support (array)
  selectedCategories: MomentCategory[];
  selectedBadges: string[]; // Badge IDs
  
  // Settings
  visibility: MomentVisibility;
  actor: ActorRef;
  
  // Scheduling
  scheduledAt: Date | null;
  
  // UI State
  isSubmitting: boolean;
  isDirty: boolean;
}

// Actions for state reducer
export type PostWizardAction =
  | { type: 'SET_STEP'; payload: PostWizardStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_MEDIA'; payload: OrderedMediaItem[] }
  | { type: 'ADD_MEDIA'; payload: ComposerMediaItem[] }
  | { type: 'REMOVE_MEDIA'; payload: string }
  | { type: 'REORDER_MEDIA'; payload: OrderedMediaItem[] }
  | { type: 'SET_COVER_INDEX'; payload: number }
  | { type: 'SET_ACTIVE_MEDIA_ID'; payload: string | null }
  | { type: 'SET_STUDIO_EDITS'; payload: { mediaId: string; edits: StudioEdits } }
  | { type: 'SET_CAPTION'; payload: string }
  | { type: 'SET_TAGS'; payload: TaggableEntity[] }
  // Multi-course actions
  | { type: 'ADD_COURSE'; payload: GolfCourse }
  | { type: 'REMOVE_COURSE'; payload: string }
  | { type: 'REORDER_COURSES'; payload: GolfCourse[] }
  | { type: 'CLEAR_COURSES' }
  | { type: 'SET_CATEGORIES'; payload: MomentCategory[] }
  | { type: 'SET_BADGES'; payload: string[] }
  | { type: 'SET_VISIBILITY'; payload: MomentVisibility }
  | { type: 'SET_ACTOR'; payload: ActorRef }
  | { type: 'SET_SCHEDULED_AT'; payload: Date | null }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET' }
  | { type: 'LOAD_DRAFT'; payload: Partial<PostWizardState> };

// Props for the main wizard component
export interface PostWizardProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-loaded media items (e.g., from camera/gallery) */
  initialMedia?: ComposerMediaItem[];
  /** Pre-selected courses (supports multiple) */
  initialCourses?: GolfCourse[];
  /** One-time actor override */
  initialActorOverride?: ActorRef;
}

// Props for individual step components
export interface StepProps {
  state: PostWizardState;
  dispatch: React.Dispatch<PostWizardAction>;
}

// Submission payload sent to upload pipeline
export interface PostSubmissionPayload {
  caption: string;
  files: File[];
  mediaItems: OrderedMediaItem[];
  selectedCourse: GolfCourse | null;
  selectedTags: TaggableEntity[];
  categories: string[];
  visibility: MomentVisibility;
  actor: ActorRef;
  coverIndex: number;
  studioEditsByMediaId: Record<string, StudioEdits>;
  scheduledAt: Date | null;
}
