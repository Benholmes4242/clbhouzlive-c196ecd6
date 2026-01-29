// Post Wizard State Management Hook
import { useReducer, useCallback, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  PostWizardState,
  PostWizardAction,
  PostWizardStep,
  OrderedMediaItem,
  ActorRef,
  StudioEdits,
} from './types';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { TaggableEntity, GolfCourse, MomentVisibility, MomentCategory } from '../create-moment/types';
import type { DraftWithMedia } from '@/services/drafts';

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
  selectedCourses: [], // Multi-course support
  selectedCategories: [],
  selectedBadges: [],
  visibility: 'anyone',
  actor: { type: 'personal', id: userId || '' },
  scheduledAt: null,
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

    case 'NEXT_STEP': {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const nextStep = STEP_ORDER[currentIndex + 1];
      return nextStep ? { ...state, currentStep: nextStep } : state;
    }

    case 'PREV_STEP': {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const prevStep = STEP_ORDER[currentIndex - 1];
      return prevStep ? { ...state, currentStep: prevStep } : state;
    }

    case 'SET_MEDIA':
      return { ...state, mediaItems: action.payload, isDirty: true };

    case 'ADD_MEDIA': {
      const startOrder = state.mediaItems.length;
      const newItems: OrderedMediaItem[] = action.payload.map((item, idx) => ({
        ...item,
        order: startOrder + idx,
      }));
      const allItems = [...state.mediaItems, ...newItems];
      return {
        ...state,
        mediaItems: allItems,
        // Set first media as active if none set
        activeMediaId: state.activeMediaId || (allItems.length > 0 ? allItems[0].id : null),
        isDirty: true,
      };
    }

    case 'REMOVE_MEDIA': {
      const filtered = state.mediaItems.filter((m) => m.id !== action.payload);
      // Reindex orders
      const reordered = filtered.map((item, idx) => ({ ...item, order: idx }));
      // Adjust cover index if needed
      let newCoverIndex = state.coverIndex;
      if (newCoverIndex >= reordered.length) {
        newCoverIndex = Math.max(0, reordered.length - 1);
      }
      // Update active media if removed
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
    case 'ADD_COURSE':
      // Prevent duplicates
      if (state.selectedCourses.some(c => c.id === action.payload.id)) {
        return state;
      }
      return { 
        ...state, 
        selectedCourses: [...state.selectedCourses, action.payload],
        isDirty: true 
      };

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

    case 'SET_CATEGORIES':
      return { ...state, selectedCategories: action.payload, isDirty: true };

    case 'SET_BADGES':
      return { ...state, selectedBadges: action.payload, isDirty: true };

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
      return { ...state, ...action.payload, isDirty: false };

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

  // Initialize state with options
  const initialState = useMemo(() => {
    const base = createInitialState(userId);
    
    // Apply initial media
    if (options.initialMedia?.length) {
      base.mediaItems = options.initialMedia.map((item, idx) => ({
        ...item,
        order: idx,
      }));
      base.activeMediaId = base.mediaItems[0]?.id || null;
    }
    
    // Apply initial courses
    if (options.initialCourses?.length) {
      base.selectedCourses = options.initialCourses;
    }
    
    // Apply actor override
    if (options.initialActorOverride) {
      base.actor = options.initialActorOverride;
    }
    
    return base;
  }, [userId, options.initialMedia, options.initialCourses, options.initialActorOverride]);

  const [state, dispatch] = useReducer(postWizardReducer, initialState);

  // Navigation helpers
  const goToStep = useCallback((step: PostWizardStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  // Media helpers
  const addMedia = useCallback((items: ComposerMediaItem[]) => {
    dispatch({ type: 'ADD_MEDIA', payload: items });
  }, []);

  const removeMedia = useCallback((mediaId: string) => {
    dispatch({ type: 'REMOVE_MEDIA', payload: mediaId });
  }, []);

  const reorderMedia = useCallback((items: OrderedMediaItem[]) => {
    dispatch({ type: 'REORDER_MEDIA', payload: items });
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

  const reorderCourses = useCallback((courses: GolfCourse[]) => {
    dispatch({ type: 'REORDER_COURSES', payload: courses });
  }, []);

  const clearCourses = useCallback(() => {
    dispatch({ type: 'CLEAR_COURSES' });
  }, []);

  const setCategories = useCallback((categories: MomentCategory[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  }, []);

  const setBadges = useCallback((badges: string[]) => {
    dispatch({ type: 'SET_BADGES', payload: badges });
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
    dispatch({ type: 'RESET' });
  }, []);

  // Load draft into wizard state
  const loadDraft = useCallback((draft: DraftWithMedia) => {
    // Convert draft media to OrderedMediaItems
    const mediaItems: OrderedMediaItem[] = (draft.media || []).map((m, idx) => ({
      id: m.id,
      type: m.mediaType as 'image' | 'video',
      previewUrl: m.mediaUrl,
      posterUrl: m.posterUrl || undefined,
      file: undefined, // Draft media already uploaded - no file needed
      order: m.displayOrder ?? idx,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      aspectRatio: m.aspectRatio ?? undefined,
      duration: m.durationSeconds ?? undefined,
    }));

    // Build course info if available
    const selectedCourse: GolfCourse | null = draft.courseId 
      ? {
          id: draft.courseId,
          name: draft.courseName || '',
          country: draft.courseCountry || '',
        }
      : null;

    // Build studio edits map
    const studioEditsByMediaId: Record<string, StudioEdits> = {};
    (draft.media || []).forEach(m => {
      if (m.studioEdits) {
        studioEditsByMediaId[m.id] = m.studioEdits as StudioEdits;
      }
    });

    // Build course info if available - convert to array
    const selectedCourses: GolfCourse[] = draft.courseId 
      ? [{
          id: draft.courseId,
          name: draft.courseName || '',
          country: draft.courseCountry || '',
        }]
      : [];

    dispatch({
      type: 'LOAD_DRAFT',
      payload: {
        mediaItems,
        activeMediaId: mediaItems.length > 0 ? mediaItems[0].id : null,
        caption: draft.content || '',
        selectedCourses,
        selectedCategories: (draft.categories || []) as unknown as MomentCategory[],
        selectedBadges: draft.badges || [],
        visibility: draft.visibility || 'anyone',
        actor: {
          type: draft.actorType || 'personal',
          id: draft.actorId,
        },
        studioEditsByMediaId,
        coverIndex: 0,
        currentStep: 'media',
      },
    });
  }, []);

  // Validation
  const canProceedFromMedia = state.mediaItems.length > 0;
  // Caption step now requires at least 1 category to proceed
  const canProceedFromCaption = state.selectedCategories.length > 0;
  const canSubmit = state.mediaItems.length > 0 && !state.isSubmitting && !!user;

  // Step index for progress display
  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);
  const totalSteps = STEP_ORDER.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return {
    state,
    dispatch,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    
    // Media
    addMedia,
    removeMedia,
    reorderMedia,
    setCoverIndex,
    setActiveMediaId,
    setStudioEdits,
    
    // Caption
    setCaption,
    setTags,
    addCourse,
    removeCourse,
    reorderCourses,
    clearCourses,
    setCategories,
    setBadges,
    
    // Settings
    setVisibility,
    setActor,
    setScheduledAt,
    
    // Submission
    setSubmitting,
    reset,
    loadDraft,
    
    // Validation
    canProceedFromMedia,
    canProceedFromCaption,
    canSubmit,
  };
}