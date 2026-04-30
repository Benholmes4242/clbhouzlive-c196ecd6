// Post Studio — Complete Type System
// Single source of truth for all Post Studio types

import type { StudioEdits } from '@/types/studio';

// ============================================================================
// ENUMS & LITERALS
// ============================================================================

/** Wizard step identifiers */
export type StudioStep =
  | 'COMPOSE'
  | 'TRIM'
  | 'POSTER'
  | 'SUCCESS';

/** Bottom panel identifiers */
export type PanelId =
  | 'mention'
  | 'course'
  | 'audience'
  | 'schedule'
  | 'drafts';

/** Post type discriminator */
export type PostType = 'standard' | 'review';

/** Visibility options (matches DB enum: post_visibility) */
export type StudioVisibility = 'anyone' | 'followers' | 'private';

/** Actor type for personal vs business posting */
export type StudioActorType = 'personal' | 'business';

// ============================================================================
// MEDIA
// ============================================================================

/** A single media item in the studio */
export interface StudioMediaItem {
  /** Local UUID */
  id: string;
  /** The raw file selected by the user */
  file: File;
  /** 'video' or 'image' */
  mediaType: 'video' | 'image';
  /** Object URL for preview rendering */
  previewUrl: string;
  /** Poster thumbnail blob URL (videos only) */
  thumbnailUrl?: string;

  // Video-specific
  /** Duration in seconds */
  duration: number | null;
  /** Trim start in seconds (default 0) */
  trimStart: number;
  /** Trim end in seconds (default = duration) */
  trimEnd: number | null;
  /** Poster frame timestamp in seconds (default 0) */
  posterTimestamp: number;
  /** Canvas capture of poster frame */
  posterPreviewUrl: string | null;

  // Image-specific
  width: number | null;
  height: number | null;

  // Validation
  validationError: string | null;

  // Studio edits (crop, filter, text, music)
  edits?: StudioEdits;
}

/** Mention token representing an @mention in the caption */
export interface MentionToken {
  /** Character start index in raw caption */
  start: number;
  /** Character end index in raw caption */
  end: number;
  /** taggable_entities.id — used for post_tags FK */
  entityId: string;
  /** taggable_entities.entity_id — actual user/business UUID for notifications */
  profileId: string;
  /** Display name shown in the pill */
  displayName: string;
  /** Entity type */
  entityType: 'user' | 'business';
  /** Avatar URL for display */
  avatarUrl?: string;
  /** Slug username (e.g. "benholmes42") */
  username?: string | null;
}

/** Tagged course reference */
export interface TaggedCourse {
  courseId: string;
  courseName: string;
  country?: string;
  region?: string;
  /** Course thumbnail image URL (golf_courses.thumbnail_image). Optional. */
  imageUrl?: string;
  /** Best (most prestigious) Top 100 rank, if any. */
  top100Rank?: number;
  /** Slug of the Top 100 list the rank came from (e.g. 'gb-i', 'global'). */
  top100List?: string;
}

// ============================================================================
// STATE
// ============================================================================

/** Complete studio state managed by usePostStudio reducer */
export interface PostStudioState {
  // Navigation
  step: StudioStep;
  previousStep: StudioStep | null;

  // Actor
  actorType: StudioActorType;
  actorId: string | null;

  // Media
  mediaItems: StudioMediaItem[];
  activeMediaIndex: number;
  /** ID of the media item selected as cover. Null = fall back to mediaItems[0]. */
  coverMediaId: string | null;

  // Post content
  caption: string;
  mentions: MentionToken[];
  taggedCourses: TaggedCourse[];
  postType: PostType;
  reviewRating: number | null;

  // Publish options
  visibility: StudioVisibility;
  scheduledAt: Date | null;

  // Draft
  draftId: string | null;
  isDirty: boolean;

  // UI state
  isDiscarding: boolean;
  activePanelId: PanelId | null;
  mentionTriggerIndex: number;
}

/** Initial state factory */
export function createInitialState(overrides?: Partial<PostStudioState>): PostStudioState {
  return {
    step: 'COMPOSE',
    previousStep: null,
    actorType: 'personal',
    actorId: null,
    mediaItems: [],
    activeMediaIndex: 0,
    coverMediaId: null,
    caption: '',
    mentions: [],
    taggedCourses: [],
    postType: 'standard',
    reviewRating: null,
    visibility: 'anyone',
    scheduledAt: null,
    draftId: null,
    isDirty: false,
    isDiscarding: false,
    activePanelId: null,
    mentionTriggerIndex: -1,
    ...overrides,
  };
}

// ============================================================================
// ACTIONS
// ============================================================================

export type PostStudioAction =
  | { type: 'SET_STEP'; payload: StudioStep }
  | { type: 'SET_ACTOR'; payload: { actorType: StudioActorType; actorId: string | null } }
  | { type: 'ADD_MEDIA'; payload: StudioMediaItem[] }
  | { type: 'REMOVE_MEDIA'; payload: string }
  | { type: 'REORDER_MEDIA'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_ACTIVE_MEDIA'; payload: number }
  | { type: 'SET_COVER_MEDIA'; payload: string | null }
  | { type: 'UPDATE_MEDIA_TRIM'; payload: { id: string; trimStart: number; trimEnd: number } }
  | { type: 'UPDATE_MEDIA_POSTER'; payload: { id: string; posterTimestamp: number; posterPreviewUrl: string | null } }
  | { type: 'SET_CAPTION'; payload: string }
  | { type: 'SET_MENTIONS'; payload: MentionToken[] }
  | { type: 'SET_TAGGED_COURSES'; payload: TaggedCourse[] }
  | { type: 'SET_POST_TYPE'; payload: PostType }
  | { type: 'SET_REVIEW_RATING'; payload: number | null }
  | { type: 'SET_VISIBILITY'; payload: StudioVisibility }
  | { type: 'SET_SCHEDULED_AT'; payload: Date | null }
  | { type: 'LOAD_DRAFT'; payload: { draftId: string; state: Partial<PostStudioState> } }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' }
  | { type: 'SET_DISCARDING'; payload: boolean }
  | { type: 'OPEN_PANEL'; payload: PanelId }
  | { type: 'CLOSE_PANEL' }
  | { type: 'RESET' }
  | { type: 'UPDATE_MEDIA_EDITS'; payload: { id: string; edits: StudioEdits } }
  | { type: 'SET_MENTION_TRIGGER'; payload: number };

// ============================================================================
// PROPS
// ============================================================================

/** Props for the root PostStudio component */
export interface PostStudioProps {
  open: boolean;
  onClose: () => void;
  initialActorType?: StudioActorType;
  initialActorId?: string;
  initialMedia?: File[];
  onSuccess?: (postId: string) => void;
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/** Upload status for individual media items (legacy compat) */
export type MediaUploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

/** Media type discriminator (legacy compat) */
export type ComposerMediaType = 'image' | 'video';

/**
 * ComposerMediaItem — legacy type alias used across the codebase.
 * New code should use StudioMediaItem instead.
 */
export interface ComposerMediaItem {
  id: string;
  type: ComposerMediaType;
  file?: File;
  previewUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  compiledVideo?: {
    streamId: string;
    playbackUrl: string;
    posterUrl: string;
    duration: number;
  };
  isRestored?: boolean;
  restoredMediaUrl?: string;
  restoredStreamId?: string;
  uploadStatus?: MediaUploadStatus;
  uploadProgress?: number;
  trimStart?: number | null;
  trimEnd?: number | null;
  posterTimestamp?: number | null;
}
