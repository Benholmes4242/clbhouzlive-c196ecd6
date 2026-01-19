/**
 * Review Wizard Types
 */

export interface ReviewWizardCourse {
  id: string;
  name: string;
  thumbnail_image?: string;
  country?: string;
  sub_country?: string;
  region?: string;
}

/**
 * Breakdown scores - 0-10 scale with 0.1 precision
 * null means the user hasn't touched/set this breakdown yet
 */
export interface ReviewBreakdowns {
  design: number | null;
  condition: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

export interface ReviewMediaItem {
  id: string; // fileKey for pending, dbRowId for existing
  type: 'image' | 'video';
  previewUrl: string; // blob URL or CDN URL
  uploadedUrl: string | null;
  status: 'pending' | 'uploading' | 'ready' | 'failed' | 'existing';
  isCover: boolean;
  dbRowId: string | null;
  streamId?: string | null;
  posterUrl?: string | null;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  addToTop10: boolean;
  top10Position: number | null;
}

export interface ExistingRating {
  id: string;
  rating: number;
  review: string | null;
  title?: string | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
}

export interface ReviewWizardProps {
  course: ReviewWizardCourse | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  existingRating?: ExistingRating;
  onRemoveFromPlayed?: () => void;
}

export type WizardStep = 'rate' | 'write' | 'media' | 'confirm';

export const STEP_ORDER: WizardStep[] = ['rate', 'write', 'media', 'confirm'];

export const STEP_CONFIG = {
  rate: {
    number: 1,
    title: 'Rate Your Experience',
    required: true,
  },
  write: {
    number: 2,
    title: 'Write Your Review',
    required: false,
  },
  media: {
    number: 3,
    title: 'Add Photos & Videos',
    required: false,
  },
  confirm: {
    number: 4,
    title: 'Review & Submit',
    required: true,
  },
} as const;
