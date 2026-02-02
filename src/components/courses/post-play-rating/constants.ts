import type { BreakdownCategory } from './types';

// Maximum number of media items (photos + videos) per review
export const MAX_REVIEW_MEDIA_ITEMS = 6;

// Maximum character length for review text
export const MAX_REVIEW_LENGTH = 4000;

// Breakdown rating categories
export const BREAKDOWN_CATEGORIES: BreakdownCategory[] = [
  { key: 'design', label: 'Course Design' },
  { key: 'condition', label: 'Course Condition' },
  { key: 'clubhouse', label: 'Clubhouse' },
  { key: 'facilities', label: 'Facilities' },
] as const;

// Slider configuration
export const RATING_SLIDER_CONFIG = {
  min: 0.5,
  max: 10,
  step: 0.1,
} as const;

// Animation timings
export const ANIMATION_TIMINGS = {
  outstandingGlow: 600,
  successButtonDelay: 1500,
  deleteSuccessFadeStart: 1800,
  deleteSuccessClose: 2200,
} as const;

// Default button text
export const BUTTON_TEXT = {
  addToPlayed: 'Add to Played',
  adding: 'Adding...',
  added: 'Added!',
  updating: 'Updating...',
  saving: 'Saving…',
} as const;
