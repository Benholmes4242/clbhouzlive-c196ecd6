// Types for the database-backed drafts system

import type { StudioEditsPayload } from '@/uploads/types';

export type DraftActorType = 'personal' | 'business';

export interface DraftMediaItem {
  id: string;
  draftId: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  streamId?: string | null;
  posterUrl?: string | null;
  width?: number | null;
  height?: number | null;
  aspectRatio?: number | null;
  durationSeconds?: number | null;
  studioEdits?: StudioEditsPayload | null;
  filterId?: string | null;
  displayOrder: number;
  fileName?: string | null;
  fileSize?: number | null;
  createdAt: string;
}

export interface Draft {
  id: string;
  userId: string;
  actorType: DraftActorType;
  actorId: string;
  content: string | null;
  visibility: 'anyone' | 'followers' | 'private';
  categories: string[];
  badges: string[];
  courseId?: string | null;
  courseName?: string | null;
  courseCountry?: string | null;
  courseData?: DraftCourseData[] | null;
  studioMusic?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;
    startAt?: number;
    volume?: number;
  } | null;
  audioMode?: 'original' | 'music_only' | null;
  createdAt: string;
  updatedAt: string;
  media?: DraftMediaItem[];
}

export interface DraftCourseData {
  id: string;
  name: string;
  country: string;
  region?: string;
}

export interface DraftSaveInput {
  actorType: DraftActorType;
  actorId: string;
  content?: string | null;
  visibility?: 'anyone' | 'followers' | 'private';
  categories?: string[];
  badges?: string[];
  courseId?: string | null;
  courseName?: string | null;
  courseCountry?: string | null;
  courseData?: DraftCourseData[] | null;
  studioMusic?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;
    startAt?: number;
    volume?: number;
  } | null;
  audioMode?: 'original' | 'music_only' | null;
}

export interface DraftMediaUploadInput {
  draftId: string;
  file: File;
  displayOrder: number;
  studioEdits?: StudioEditsPayload | null;
  filterId?: string | null;
}

export interface DraftWithMedia extends Draft {
  media: DraftMediaItem[];
}

// Max drafts per user
export const MAX_DRAFTS_PER_USER = 10;
