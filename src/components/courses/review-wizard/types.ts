/**
 * Review Wizard Types
 */

import type { MentionSuggestion } from '@/components/shared/media/MentionBottomSheet';

// Re-export for convenience
export type ReviewTaggableEntity = MentionSuggestion;

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
  previewUrl?: string; // blob URL or CDN URL (optional - CarouselSlide creates from file if missing)
  uploadedUrl: string | null;
  status: 'pending' | 'uploading' | 'queued' | 'processing' | 'ready' | 'failed' | 'existing' | 'attached';
  isCover: boolean;
  dbRowId: string | null;
  streamId?: string | null;
  posterUrl?: string | null;
  error?: string | null;
  file?: File;  // Original file reference for stable blob URL creation
  progress?: {
    loaded: number;
    total: number;
    percent: number;
    speed?: number;
    eta?: number;
  };
}

/**
 * Extended wizard step type that includes post-submit states
 */
export type WizardStepExtended = 1 | 2 | 3 | 'success' | 'share-success';

/**
 * Success screen variant type
 */
export type SuccessVariant = 'standard' | 'shared';

export interface WizardState {
  step: WizardStepExtended;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  selectedTags: ReviewTaggableEntity[];
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
  /** Pre-populated media files from Post Wizard bridge flow */
  initialMediaFiles?: File[];
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
