// Database-backed drafts service
// Handles CRUD operations for post drafts with media

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { Draft, DraftSaveInput, DraftMediaItem, DraftWithMedia, DraftCourseData } from './types';

/**
 * Fetch all drafts for the current user (with media)
 */
export async function fetchUserDrafts(): Promise<DraftWithMedia[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch drafts
  const { data: drafts, error: draftsError } = await supabase
    .from('post_drafts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (draftsError) {
    console.error('[draftService] Error fetching drafts:', draftsError);
    return [];
  }

  if (!drafts || drafts.length === 0) return [];

  // Fetch media for all drafts
  const draftIds = drafts.map(d => d.id);
  const { data: mediaItems, error: mediaError } = await supabase
    .from('post_draft_media')
    .select('*')
    .in('draft_id', draftIds)
    .order('display_order', { ascending: true });

  if (mediaError) {
    console.error('[draftService] Error fetching draft media:', mediaError);
  }

  // Map to typed objects
  return drafts.map(d => ({
    id: d.id,
    userId: d.user_id,
    actorType: d.actor_type as Draft['actorType'],
    actorId: d.actor_id,
    content: d.content,
    visibility: d.visibility as Draft['visibility'],
    categories: d.categories || [],
    badges: d.badges || [],
    courseId: d.course_id,
    courseName: d.course_name,
    courseCountry: d.course_country,
    courseData: (d as any).course_data as DraftCourseData[] | null,
    studioMusic: d.studio_music as Draft['studioMusic'],
    audioMode: d.audio_mode as Draft['audioMode'],
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    media: (mediaItems || [])
      .filter(m => m.draft_id === d.id)
      .map(m => ({
        id: m.id,
        draftId: m.draft_id,
        mediaType: m.media_type as DraftMediaItem['mediaType'],
        mediaUrl: m.media_url,
        streamId: m.stream_id,
        posterUrl: m.poster_url,
        width: m.width,
        height: m.height,
        aspectRatio: m.aspect_ratio ? Number(m.aspect_ratio) : null,
        durationSeconds: m.duration_seconds,
        studioEdits: m.studio_edits as DraftMediaItem['studioEdits'],
        filterId: m.filter_id,
        displayOrder: m.display_order,
        fileName: m.file_name,
        fileSize: m.file_size ? Number(m.file_size) : null,
        createdAt: m.created_at,
      })),
  }));
}

/**
 * Get draft count for the current user
 */
export async function getDraftCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('post_drafts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    console.error('[draftService] Error getting draft count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Create a new draft
 */
export async function createDraft(input: DraftSaveInput): Promise<Draft | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    actor_type: input.actorType,
    actor_id: input.actorId,
    content: input.content || null,
    visibility: input.visibility || 'anyone',
    categories: input.categories || [],
    badges: input.badges || [],
    course_id: input.courseId || null,
    course_name: input.courseName || null,
    course_country: input.courseCountry || null,
    course_data: input.courseData || null,
    studio_music: input.studioMusic || null,
    audio_mode: input.audioMode || null,
  };

  const { data, error } = await supabase
    .from('post_drafts')
    .insert(insertPayload as any)
    .select()
    .single();

  if (error) {
    console.error('[draftService] Error creating draft:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    actorType: data.actor_type as Draft['actorType'],
    actorId: data.actor_id,
    content: data.content,
    visibility: data.visibility as Draft['visibility'],
    categories: data.categories || [],
    badges: data.badges || [],
    courseId: data.course_id,
    courseName: data.course_name,
    courseCountry: data.course_country,
    courseData: (data as any).course_data as DraftCourseData[] | null,
    studioMusic: data.studio_music as Draft['studioMusic'],
    audioMode: data.audio_mode as Draft['audioMode'],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update an existing draft
 */
export async function updateDraft(draftId: string, input: Partial<DraftSaveInput>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};
  
  if (input.actorType !== undefined) updateData.actor_type = input.actorType;
  if (input.actorId !== undefined) updateData.actor_id = input.actorId;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.visibility !== undefined) updateData.visibility = input.visibility;
  if (input.categories !== undefined) updateData.categories = input.categories;
  if (input.badges !== undefined) updateData.badges = input.badges;
  if (input.courseId !== undefined) updateData.course_id = input.courseId;
  if (input.courseName !== undefined) updateData.course_name = input.courseName;
  if (input.courseCountry !== undefined) updateData.course_country = input.courseCountry;
  if (input.courseData !== undefined) updateData.course_data = input.courseData;
  if (input.studioMusic !== undefined) updateData.studio_music = input.studioMusic;
  if (input.audioMode !== undefined) updateData.audio_mode = input.audioMode;

  const { error } = await supabase
    .from('post_drafts')
    .update(updateData)
    .eq('id', draftId);

  if (error) {
    console.error('[draftService] Error updating draft:', error);
    return false;
  }

  return true;
}

/**
 * Delete a draft and its media
 */
export async function deleteDraft(draftId: string): Promise<boolean> {
  // Media is cascade deleted via FK
  const { error } = await supabase
    .from('post_drafts')
    .delete()
    .eq('id', draftId);

  if (error) {
    console.error('[draftService] Error deleting draft:', error);
    return false;
  }

  return true;
}

/**
 * Delete all drafts for the current user
 */
export async function deleteAllDrafts(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('post_drafts')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('[draftService] Error deleting all drafts:', error);
    return false;
  }

  return true;
}

/**
 * Add media to a draft
 */
export async function addDraftMedia(
  draftId: string,
  mediaUrl: string,
  mediaType: 'image' | 'video',
  displayOrder: number,
  options?: {
    streamId?: string;
    posterUrl?: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
    durationSeconds?: number;
    studioEdits?: Record<string, unknown>;
    filterId?: string;
    fileName?: string;
    fileSize?: number;
  }
): Promise<DraftMediaItem | null> {
  const insertData = {
    draft_id: draftId,
    media_type: mediaType,
    media_url: mediaUrl,
    display_order: displayOrder,
    stream_id: options?.streamId ?? null,
    poster_url: options?.posterUrl ?? null,
    width: options?.width ?? null,
    height: options?.height ?? null,
    aspect_ratio: options?.aspectRatio ?? null,
    // post_draft_media.duration_seconds is numeric(10,3) (widened 2026-04-22).
    // Preserve millisecond precision from the client measurement.
    duration_seconds: options?.durationSeconds ?? null,
    studio_edits: (options?.studioEdits ?? null) as Json,
    filter_id: options?.filterId ?? null,
    file_name: options?.fileName ?? null,
    file_size: options?.fileSize ?? null,
  };
  const { data, error } = await supabase
    .from('post_draft_media')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('[draftService] Error adding draft media:', error);
    return null;
  }

  return {
    id: data.id,
    draftId: data.draft_id,
    mediaType: data.media_type as DraftMediaItem['mediaType'],
    mediaUrl: data.media_url,
    streamId: data.stream_id,
    posterUrl: data.poster_url,
    width: data.width,
    height: data.height,
    aspectRatio: data.aspect_ratio ? Number(data.aspect_ratio) : null,
    durationSeconds: data.duration_seconds,
    studioEdits: data.studio_edits as DraftMediaItem['studioEdits'],
    filterId: data.filter_id,
    displayOrder: data.display_order,
    fileName: data.file_name,
    fileSize: data.file_size ? Number(data.file_size) : null,
    createdAt: data.created_at,
  };
}

/**
 * Update draft media item
 */
export async function updateDraftMedia(
  mediaId: string,
  updates: {
    studioEdits?: unknown;
    filterId?: string;
    displayOrder?: number;
  }
): Promise<boolean> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.studioEdits !== undefined) updateData.studio_edits = updates.studioEdits;
  if (updates.filterId !== undefined) updateData.filter_id = updates.filterId;
  if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

  const { error } = await supabase
    .from('post_draft_media')
    .update(updateData)
    .eq('id', mediaId);

  if (error) {
    console.error('[draftService] Error updating draft media:', error);
    return false;
  }

  return true;
}

/**
 * Delete draft media item
 */
export async function deleteDraftMedia(mediaId: string): Promise<boolean> {
  const { error } = await supabase
    .from('post_draft_media')
    .delete()
    .eq('id', mediaId);

  if (error) {
    console.error('[draftService] Error deleting draft media:', error);
    return false;
  }

  return true;
}

/**
 * Get a single draft by ID with its media
 */
export async function getDraft(draftId: string): Promise<DraftWithMedia | null> {
  const { data: draft, error: draftError } = await supabase
    .from('post_drafts')
    .select('*')
    .eq('id', draftId)
    .single();

  if (draftError || !draft) {
    console.error('[draftService] Error fetching draft:', draftError);
    return null;
  }

  const { data: mediaItems, error: mediaError } = await supabase
    .from('post_draft_media')
    .select('*')
    .eq('draft_id', draftId)
    .order('display_order', { ascending: true });

  if (mediaError) {
    console.error('[draftService] Error fetching draft media:', mediaError);
  }

  return {
    id: draft.id,
    userId: draft.user_id,
    actorType: draft.actor_type as Draft['actorType'],
    actorId: draft.actor_id,
    content: draft.content,
    visibility: draft.visibility as Draft['visibility'],
    categories: draft.categories || [],
    badges: draft.badges || [],
    courseId: draft.course_id,
    courseName: draft.course_name,
    courseCountry: draft.course_country,
    courseData: (draft as any).course_data as DraftCourseData[] | null,
    studioMusic: draft.studio_music as Draft['studioMusic'],
    audioMode: draft.audio_mode as Draft['audioMode'],
    createdAt: draft.created_at,
    updatedAt: draft.updated_at,
    media: (mediaItems || []).map(m => ({
      id: m.id,
      draftId: m.draft_id,
      mediaType: m.media_type as DraftMediaItem['mediaType'],
      mediaUrl: m.media_url,
      streamId: m.stream_id,
      posterUrl: m.poster_url,
      width: m.width,
      height: m.height,
      aspectRatio: m.aspect_ratio ? Number(m.aspect_ratio) : null,
      durationSeconds: m.duration_seconds,
      studioEdits: m.studio_edits as DraftMediaItem['studioEdits'],
      filterId: m.filter_id,
      displayOrder: m.display_order,
      fileName: m.file_name,
      fileSize: m.file_size ? Number(m.file_size) : null,
      createdAt: m.created_at,
    })),
  };
}
