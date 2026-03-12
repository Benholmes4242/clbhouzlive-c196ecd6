// Post Wizard State Management Hook
import { useReducer, useCallback, useMemo, useRef } from 'react';
import { POST_LIMITS } from '@/constants/postLimits';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import {
  PostWizardState,
  PostWizardAction,
  PostWizardStep,
  OrderedMediaItem,
  ActorRef,
  StudioEdits,
} from './types';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { TaggableEntity, GolfCourse, MomentVisibility } from '../create-moment/types';
import type { DraftWithMedia } from '@/services/drafts';
import type { ScheduledPost } from '@/services/posts/scheduledPosts';
import { revokeMediaItemUrls } from '@/lib/mediaUtils';

// Step order for navigation
const STEP_ORDER: PostWizardStep[] = ['media', 'caption', 'confirm'];

// Initial state factory
const createInitialState = (userId?: string): PostWizardState => ({
  currentStep: 'media',
  mediaItems: [],
  coverIndex: 0,
  studioEditsByMediaId: {},
  activeMediaId: null,
  caption: '',
  selectedTags: [],
  selectedCourses: [],
  visibility: 'anyone',
  actor: { type: 'personal', id: userId || '' },
  scheduledAt: null,
  isEditMode: false,
  editPostId: null,
  currentDraftId: null,
  isSubmitting: false,
  isDirty: false,
});

// Reducer for state management
function postWizardReducer(
  state: PostWizardState,
  action: PostWizardAction
): PostWizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_MEDIA':
      return { ...state, mediaItems: action.payload, isDirty: true };

    case 'ADD_MEDIA': {
      const startOrder = state.mediaItems.length;
      const newItems: OrderedMediaItem[] = action.payload.map((item, idx) => ({
        ...item,
        order: startOrder + idx,
      }));
      const allItems = [...state.mediaItems, ...newItems].slice(0, POST_LIMITS.MAX_MEDIA_COUNT);
      return {
        ...state,
        mediaItems: allItems,
        activeMediaId: state.activeMediaId || (allItems.length > 0 ? allItems[0].id : null),
        isDirty: true,
      };
    }

    case 'REMOVE_MEDIA': {
      const filtered = state.mediaItems.filter((m) => m.id !== action.payload);
      const reordered = filtered.map((item, idx) => ({ ...item, order: idx }));
      let newCoverIndex = state.coverIndex;
      if (newCoverIndex >= reordered.length) {
        newCoverIndex = Math.max(0, reordered.length - 1);
      }
      let newActiveId = state.activeMediaId;
      if (state.activeMediaId === action.payload) {
        newActiveId = reordered.length > 0 ? reordered[0].id : null;
      }
      return {
        ...state,
        mediaItems: reordered,
        coverIndex: newCoverIndex,
        activeMediaId: newActiveId,
        isDirty: true,
      };
    }

    case 'REORDER_MEDIA':
      return { ...state, mediaItems: action.payload, isDirty: true };

    case 'UPDATE_MEDIA_ITEM': {
      return {
        ...state,
        mediaItems: state.mediaItems.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        ),
      };
    }

    case 'SET_COVER_INDEX':
      return { ...state, coverIndex: action.payload, isDirty: true };

    case 'SET_ACTIVE_MEDIA_ID':
      return { ...state, activeMediaId: action.payload };

    case 'SET_STUDIO_EDITS':
      return {
        ...state,
        studioEditsByMediaId: {
          ...state.studioEditsByMediaId,
          [action.payload.mediaId]: action.payload.edits,
        },
        isDirty: true,
      };

    case 'SET_CAPTION':
      return { ...state, caption: action.payload, isDirty: true };

    case 'SET_TAGS':
      return { ...state, selectedTags: action.payload, isDirty: true };

    // Multi-course actions
    case 'ADD_COURSE': {
      const course = action.payload;
      if (!course?.id || !course?.name) {
        console.error('usePostWizard: Invalid course in ADD_COURSE action:', course);
        return state;
      }
      if (state.selectedCourses.some(c => c.id === course.id)) {
        return state;
      }
      return { 
        ...state, 
        selectedCourses: [...state.selectedCourses, course],
        isDirty: true 
      };
    }

    case 'REMOVE_COURSE':
      return { 
        ...state, 
        selectedCourses: state.selectedCourses.filter(c => c.id !== action.payload),
        isDirty: true 
      };

    case 'REORDER_COURSES':
      return { 
        ...state, 
        selectedCourses: action.payload,
        isDirty: true 
      };

    case 'CLEAR_COURSES':
      return { 
        ...state, 
        selectedCourses: [],
        isDirty: true 
      };

    case 'SET_VISIBILITY':
      return { ...state, visibility: action.payload, isDirty: true };

    case 'SET_ACTOR':
      return { ...state, actor: action.payload, isDirty: true };

    case 'SET_SCHEDULED_AT':
      return { ...state, scheduledAt: action.payload, isDirty: true };

    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };

    case 'RESET':
      return createInitialState(state.actor.id);

    case 'LOAD_DRAFT':
      return { ...state, ...action.payload, currentDraftId: action.payload.currentDraftId ?? null, isDirty: false };

    case 'LOAD_EXISTING_POST':
      return {
        ...state,
        ...action.payload.state,
        isEditMode: true,
        editPostId: action.payload.postId,
        isDirty: false,
        currentStep: 'caption',
      };

    case 'LOAD_SCHEDULED_POST':
      return {
        ...state,
        ...action.payload.state,
        isEditMode: true,
        editPostId: action.payload.postId,
        scheduledAt: action.payload.scheduledAt ?? null,
        isDirty: false,
        currentStep: 'media',
      };

    default:
      return state;
  }
}

export interface UsePostWizardOptions {
  initialMedia?: ComposerMediaItem[];
  initialCourses?: GolfCourse[];
  initialActorOverride?: ActorRef;
}

export function usePostWizard(options: UsePostWizardOptions = {}) {
  const { user } = useSupabaseSession();
  const userId = user?.id;

  const initialState = useMemo(() => {
    const base = createInitialState(userId);
    if (options.initialMedia?.length) {
      base.mediaItems = options.initialMedia.map((item, idx) => ({
        ...item,
        order: idx,
      }));
      base.activeMediaId = base.mediaItems[0]?.id || null;
    }
    if (options.initialCourses?.length) {
      base.selectedCourses = options.initialCourses;
    }
    if (options.initialActorOverride) {
      base.actor = options.initialActorOverride;
    }
    return base;
  }, [userId, options.initialMedia, options.initialCourses, options.initialActorOverride]);

  const [state, dispatch] = useReducer(postWizardReducer, initialState);

  const mediaItemsRef = useRef(state.mediaItems);
  mediaItemsRef.current = state.mediaItems;

  // Navigation helpers (legacy — kept for LOAD_DRAFT compatibility)

  // Media helpers
  const addMedia = useCallback((items: ComposerMediaItem[]) => {
    dispatch({ type: 'ADD_MEDIA', payload: items });
  }, []);

  const removeMedia = useCallback((mediaId: string) => {
    const itemToRemove = mediaItemsRef.current.find(item => item.id === mediaId);
    if (itemToRemove) {
      revokeMediaItemUrls([itemToRemove]);
    }
    dispatch({ type: 'REMOVE_MEDIA', payload: mediaId });
  }, []);


  const setCoverIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_COVER_INDEX', payload: index });
  }, []);

  const setActiveMediaId = useCallback((mediaId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_MEDIA_ID', payload: mediaId });
  }, []);

  const setStudioEdits = useCallback((mediaId: string, edits: StudioEdits) => {
    dispatch({ type: 'SET_STUDIO_EDITS', payload: { mediaId, edits } });
  }, []);

  // Caption helpers
  const setCaption = useCallback((caption: string) => {
    dispatch({ type: 'SET_CAPTION', payload: caption });
  }, []);

  const setTags = useCallback((tags: TaggableEntity[]) => {
    dispatch({ type: 'SET_TAGS', payload: tags });
  }, []);

  // Multi-course helpers
  const addCourse = useCallback((course: GolfCourse) => {
    dispatch({ type: 'ADD_COURSE', payload: course });
  }, []);

  const removeCourse = useCallback((courseId: string) => {
    dispatch({ type: 'REMOVE_COURSE', payload: courseId });
  }, []);


  // Settings helpers
  const setVisibility = useCallback((visibility: MomentVisibility) => {
    dispatch({ type: 'SET_VISIBILITY', payload: visibility });
  }, []);

  const setActor = useCallback((actor: ActorRef) => {
    dispatch({ type: 'SET_ACTOR', payload: actor });
  }, []);

  const setScheduledAt = useCallback((date: Date | null) => {
    dispatch({ type: 'SET_SCHEDULED_AT', payload: date });
  }, []);

  // Submission helpers
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting });
  }, []);

  const reset = useCallback(() => {
    if (mediaItemsRef.current.length > 0) {
      revokeMediaItemUrls(mediaItemsRef.current);
    }
    dispatch({ type: 'RESET' });
  }, []);

  // Load draft into wizard state
  const loadDraft = useCallback((draft: DraftWithMedia) => {
    const mediaItems: OrderedMediaItem[] = (draft.media || []).map((m, idx) => ({
      id: m.id,
      type: m.mediaType as 'image' | 'video',
      previewUrl: m.mediaUrl,
      posterUrl: m.posterUrl || undefined,
      file: undefined,
      order: m.displayOrder ?? idx,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      aspectRatio: m.aspectRatio ?? undefined,
      duration: m.durationSeconds ?? undefined,
      isRestored: true,
    }));

    const courseDataArr = (draft as any).courseData ?? (draft as any).course_data;
    let selectedCourses: GolfCourse[] = [];
    if (Array.isArray(courseDataArr) && courseDataArr.length > 0) {
      selectedCourses = courseDataArr
        .filter((c: any) => c.id && c.name)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          country: c.country || '',
          region: c.region || undefined,
        }));
    } else if (draft.courseId) {
      selectedCourses = [{
        id: draft.courseId,
        name: draft.courseName || '',
        country: draft.courseCountry || '',
      }];
    }

    const studioEditsByMediaId: Record<string, StudioEdits> = {};
    (draft.media || []).forEach(m => {
      if (m.studioEdits) {
        studioEditsByMediaId[m.id] = m.studioEdits as StudioEdits;
      }
    });

    dispatch({
      type: 'LOAD_DRAFT',
      payload: {
        mediaItems,
        activeMediaId: mediaItems.length > 0 ? mediaItems[0].id : null,
        caption: draft.content || '',
        selectedCourses,
        visibility: draft.visibility || 'anyone',
        actor: {
          type: draft.actorType || 'personal',
          id: draft.actorId,
        },
        studioEditsByMediaId,
        coverIndex: 0,
        currentStep: 'media',
        currentDraftId: draft.id,
      },
    });
  }, []);

  // Load scheduled post into wizard for editing
  const loadScheduledPost = useCallback((post: ScheduledPost) => {
    const mediaItems: OrderedMediaItem[] = (post.media || []).map((m, idx) => ({
      id: m.id,
      type: m.mediaType as 'image' | 'video',
      previewUrl: m.mediaUrl,
      posterUrl: m.posterUrl || undefined,
      file: undefined,
      order: m.displayOrder ?? idx,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      aspectRatio: m.aspectRatio ?? undefined,
      duration: m.durationSeconds ?? undefined,
      isRestored: true,
    }));

    const studioEditsByMediaId: Record<string, StudioEdits> = {};
    (post.media || []).forEach(m => {
      if (m.studioEdits) {
        studioEditsByMediaId[m.id] = m.studioEdits as StudioEdits;
      }
    });

    let selectedCourses: GolfCourse[] = [];
    if (post.courseId) {
      // We only have courseId from the list view; name will be minimal
      selectedCourses = [{ id: post.courseId, name: '', country: '' }];
    }

    dispatch({
      type: 'LOAD_SCHEDULED_POST',
      payload: {
        postId: post.id,
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
        state: {
          mediaItems,
          activeMediaId: mediaItems.length > 0 ? mediaItems[0].id : null,
          caption: post.content || '',
          selectedCourses,
          visibility: (post.visibility || 'anyone') as MomentVisibility,
          actor: {
            type: (post.actorType || 'personal') as 'personal' | 'business',
            id: post.actorId,
          },
          studioEditsByMediaId,
          coverIndex: 0,
        },
      },
    });
  }, []);

  // Load existing post into wizard for editing
  const loadExistingPost = useCallback(async (postData: import('@/lib/fetchPostForEdit').PostForEdit) => {
    const { post, media, courses } = postData;

    const mediaItems: OrderedMediaItem[] = media.map((m, idx) => ({
      id: m.id,
      type: m.media_type as 'image' | 'video',
      previewUrl: m.media_url,
      posterUrl: m.poster_url || undefined,
      file: undefined,
      order: m.display_order ?? idx,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      aspectRatio: m.aspect_ratio ?? undefined,
      duration: m.duration_seconds ?? undefined,
    }));

    // Fetch post tags for edit mode hydration
    let hydratedTags: TaggableEntity[] = [];
    try {
      const { data: postTags } = await supabase
        .from('post_tags')
        .select(`
          id,
          tagged_entity_id,
          taggable_entities!inner (
            id,
            entity_id,
            entity_type,
            name,
            username,
            profile_image_url
          )
        `)
        .eq('post_id', post.id);

      if (postTags && postTags.length > 0) {
        hydratedTags = postTags
          .filter((pt: any) => pt.taggable_entities)
          .map((pt: any) => ({
            id: pt.taggable_entities.id,
            entity_id: pt.taggable_entities.entity_id,
            entity_type: pt.taggable_entities.entity_type as 'user' | 'business',
            name: pt.taggable_entities.name || 'Unknown',
            username: pt.taggable_entities.username,
            avatar_url: pt.taggable_entities.profile_image_url || undefined,
          }));
      }
    } catch (e) {
      console.error('Failed to hydrate post tags for edit:', e);
    }

    dispatch({
      type: 'LOAD_EXISTING_POST',
      payload: {
        postId: post.id,
        state: {
          mediaItems,
          activeMediaId: mediaItems.length > 0 ? mediaItems[0].id : null,
          caption: post.content || '',
          selectedTags: hydratedTags,
          selectedCourses: courses.map(c => ({
            id: c.id,
            name: c.name,
            country: c.country,
            region: c.region || undefined,
          })),
          visibility: (post.visibility || 'anyone') as MomentVisibility,
          actor: {
            type: post.actor_type as 'personal' | 'business',
            id: post.actor_id,
          },
          coverIndex: 0,
        },
      },
    });
  }, []);

  // Validation
  const canProceedFromMedia = state.mediaItems.length > 0;
  const canProceedFromCaption = true; // No category requirement
  const canSubmit = (state.mediaItems.length > 0 || state.isEditMode) && !state.isSubmitting && !!user;

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);
  const totalSteps = STEP_ORDER.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return {
    state,
    dispatch,
    
    // Media
    addMedia,
    removeMedia,
    setCoverIndex,
    setActiveMediaId,
    setStudioEdits,
    
    // Caption
    setCaption,
    setTags,
    addCourse,
    removeCourse,
    
    // Settings
    setVisibility,
    setActor,
    setScheduledAt,
    
    // Submission
    setSubmitting,
    reset,
    loadDraft,
    loadExistingPost,
    loadScheduledPost,
    
    // Validation
    canProceedFromMedia,
    canProceedFromCaption,
    canSubmit,
  };
}
