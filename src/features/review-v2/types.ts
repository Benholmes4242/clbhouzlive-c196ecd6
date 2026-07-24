import type { VerdictSlug } from './tokens';

export type CategoryKey = 'design' | 'condition' | 'clubhouse' | 'facilities';

export interface ReviewV2Course {
  id: string;
  name: string;
  thumbnail_image?: string | null;
  country?: string | null;
  sub_country?: string | null;
  region?: string | null;
}

export interface ExistingReview {
  id: string;
  rating: number | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  review: string | null;
  verdict: string | null;
  share_to_feed: boolean | null;
  // L6 - tee played (optional)
  tee_label?: string | null;
}

export interface ExistingMedia {
  id: string;
  media_url: string;
  media_type: string;
  poster_url: string | null;
  stream_id: string | null;
}

export interface ReviewComposerState {
  verdict: VerdictSlug | null;
  overall: number | null;
  scores: Record<CategoryKey, number | null>;
  reviewText: string;
  shareToFeed: boolean;
  // L6 - tee played (optional). null = not selected.
  teeLabel: string | null;
}

export type MediaItemStatus = 'pending' | 'uploading' | 'ready' | 'failed' | 'existing';

export interface MediaItem {
  id: string;             // client id
  file?: File;            // absent when existing
  type: 'image' | 'video';
  previewUrl: string;     // blob URL or remote URL
  posterUrl?: string | null;
  status: MediaItemStatus;
  progress: number;       // 0-100
  error?: string;
  dbRowId?: string | null;
  streamId?: string | null;
  uploadedUrl?: string | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  isExisting?: boolean;
}
