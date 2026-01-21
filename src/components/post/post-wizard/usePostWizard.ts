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

// Step order for navigation
const STEP_ORDER: PostWizardStep[] = ['media', 'caption', 'confirm'];

// Initial state factory
const createInitialState = (userId?: string): PostWizardState => ({
  currentStep: 'media',
  mediaItems: [],
  coverIndex: 0,
  studioEditsByMediaId: {},
  caption: '',
  selectedTags: [],
  selectedCourse: null,
  selectedCategories: [],
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
      return {
        ...state,
        mediaItems: [...state.mediaItems, ...newItems],
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
      return {
        ...state,
        mediaItems: reordered,
        coverIndex: newCoverIndex,
        isDirty: true,
      };
    }

    case 'REORDER_MEDIA':
      return { ...state, mediaItems: action.payload, isDirty: true };

    case 'SET_COVER_INDEX':
      return { ...state, coverIndex: action.payload, isDirty: true };

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

    case 'SET_COURSE':
      return { ...state, selectedCourse: action.payload, isDirty: true };

    case 'SET_CATEGORIES':
      return { ...state, selectedCategories: action.payload, isDirty: true };

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
  initialCourse?: GolfCourse | null;
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
    }
    
    // Apply initial course
    if (options.initialCourse) {
      base.selectedCourse = options.initialCourse;
    }
    
    // Apply actor override
    if (options.initialActorOverride) {
      base.actor = options.initialActorOverride;
    }
    
    return base;
  }, [userId, options.initialMedia, options.initialCourse, options.initialActorOverride]);

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

  const setCourse = useCallback((course: GolfCourse | null) => {
    dispatch({ type: 'SET_COURSE', payload: course });
  }, []);

  const setCategories = useCallback((categories: MomentCategory[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
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

  // Validation
  const canProceedFromMedia = state.mediaItems.length > 0;
  const canProceedFromCaption = true; // Caption is optional
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
    setStudioEdits,
    
    // Caption
    setCaption,
    setTags,
    setCourse,
    setCategories,
    
    // Settings
    setVisibility,
    setActor,
    setScheduledAt,
    
    // Submission
    setSubmitting,
    reset,
    
    // Validation
    canProceedFromMedia,
    canProceedFromCaption,
    canSubmit,
  };
}
