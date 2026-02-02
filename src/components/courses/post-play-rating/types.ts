// Types for PostPlayRatingModal and related components

export interface ExistingMedia {
  id: string;
  media_url: string;
  media_type: string;
  poster_url: string | null;
  stream_id: string | null;
}

export interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
  country?: string;
  sub_country?: string;
  region?: string;
}

export interface PostPlayRatingModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  existingRating?: any;
  onRemoveFromPlayed?: () => void;
  isLoading?: boolean;
}

export interface BreakdownItem {
  label: string;
  value: number;
}

export type ShareState = 'idle' | 'posting' | 'shared';

export interface RatingConfirmationViewProps {
  mode: 'submitted' | 'updated';
  courseName: string;
  courseId: string;
  ratingId: string;
  userRating: number;
  reviewText: string | null;
  breakdown?: BreakdownItem[];
  communityScore?: number | null;
  submittedMedia?: ExistingMedia[];
  heroImageUrl?: string | null;
  heroSubtitle?: string;
  onBack: () => void;
  onShareReview: () => Promise<{ success: boolean; postId?: string; alreadyShared?: boolean } | void>;
}

// Breakdown category configuration
export interface BreakdownCategory {
  key: 'design' | 'condition' | 'clubhouse' | 'facilities';
  label: string;
}

// Form state interface for the consolidated hook
export interface RatingFormState {
  // Core ratings
  overallRating: number | null;
  reviewText: string;
  
  // Breakdown scores
  designScore: number | null;
  conditionScore: number | null;
  clubhouseScore: number | null;
  facilitiesScore: number | null;
  
  // Track which breakdowns have been touched
  designTouched: boolean;
  conditionTouched: boolean;
  clubhouseTouched: boolean;
  facilitiesTouched: boolean;
  
  // Media state
  existingMediaItems: ExistingMedia[];
  selectedImages: File[];
  imagePreviews: Map<string, string>;
  localVideoPosters: Map<string, string>;
  
  // UI state
  isSubmitting: boolean;
  showConfirmation: boolean;
  showRemoveDialog: boolean;
  submittedRatingId: string | null;
  buttonText: string;
  isDeleted: boolean;
  isFadingOut: boolean;
  
  // Outstanding tier animation tracking
  justEnteredOutstanding: boolean;
  breakdownOutstandingEntry: Record<string, boolean>;
}

export type RatingFormAction =
  | { type: 'SET_OVERALL_RATING'; payload: number | null }
  | { type: 'SET_REVIEW_TEXT'; payload: string }
  | { type: 'SET_DESIGN_SCORE'; payload: number | null }
  | { type: 'SET_CONDITION_SCORE'; payload: number | null }
  | { type: 'SET_CLUBHOUSE_SCORE'; payload: number | null }
  | { type: 'SET_FACILITIES_SCORE'; payload: number | null }
  | { type: 'SET_DESIGN_TOUCHED'; payload: boolean }
  | { type: 'SET_CONDITION_TOUCHED'; payload: boolean }
  | { type: 'SET_CLUBHOUSE_TOUCHED'; payload: boolean }
  | { type: 'SET_FACILITIES_TOUCHED'; payload: boolean }
  | { type: 'SET_EXISTING_MEDIA'; payload: ExistingMedia[] }
  | { type: 'ADD_IMAGES'; payload: { files: File[]; previews: Map<string, string> } }
  | { type: 'REMOVE_IMAGE'; payload: { index: number; fileKey: string } }
  | { type: 'SET_LOCAL_VIDEO_POSTERS'; payload: Map<string, string> }
  | { type: 'SET_IS_SUBMITTING'; payload: boolean }
  | { type: 'SET_SHOW_CONFIRMATION'; payload: boolean }
  | { type: 'SET_SHOW_REMOVE_DIALOG'; payload: boolean }
  | { type: 'SET_SUBMITTED_RATING_ID'; payload: string | null }
  | { type: 'SET_BUTTON_TEXT'; payload: string }
  | { type: 'SET_IS_DELETED'; payload: boolean }
  | { type: 'SET_IS_FADING_OUT'; payload: boolean }
  | { type: 'SET_JUST_ENTERED_OUTSTANDING'; payload: boolean }
  | { type: 'SET_BREAKDOWN_OUTSTANDING_ENTRY'; payload: Record<string, boolean> }
  | { type: 'POPULATE_FROM_EXISTING'; payload: { rating: any; media: ExistingMedia[] } }
  | { type: 'CLEAR_LOCAL_MEDIA' }
  | { type: 'RESET_FORM'; payload?: { keepEditData?: boolean } };
