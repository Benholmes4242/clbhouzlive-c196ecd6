import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { RatingFormState, RatingFormAction, ExistingMedia } from '../types';

const initialState: RatingFormState = {
  // Core ratings
  overallRating: null,
  reviewText: '',
  
  // Breakdown scores
  designScore: null,
  conditionScore: null,
  clubhouseScore: null,
  facilitiesScore: null,
  
  // Touched state
  designTouched: false,
  conditionTouched: false,
  clubhouseTouched: false,
  facilitiesTouched: false,
  
  // Media state
  existingMediaItems: [],
  selectedImages: [],
  imagePreviews: new Map(),
  localVideoPosters: new Map(),
  
  // UI state
  isSubmitting: false,
  showConfirmation: false,
  showRemoveDialog: false,
  submittedRatingId: null,
  buttonText: 'Add to Played',
  isDeleted: false,
  isFadingOut: false,
  
  // Animation tracking
  justEnteredExceptional: false,
  breakdownExceptionalEntry: {},
};

function ratingFormReducer(state: RatingFormState, action: RatingFormAction): RatingFormState {
  switch (action.type) {
    case 'SET_OVERALL_RATING':
      return { ...state, overallRating: action.payload };
    case 'SET_REVIEW_TEXT':
      return { ...state, reviewText: action.payload };
    case 'SET_DESIGN_SCORE':
      return { ...state, designScore: action.payload };
    case 'SET_CONDITION_SCORE':
      return { ...state, conditionScore: action.payload };
    case 'SET_CLUBHOUSE_SCORE':
      return { ...state, clubhouseScore: action.payload };
    case 'SET_FACILITIES_SCORE':
      return { ...state, facilitiesScore: action.payload };
    case 'SET_DESIGN_TOUCHED':
      return { ...state, designTouched: action.payload };
    case 'SET_CONDITION_TOUCHED':
      return { ...state, conditionTouched: action.payload };
    case 'SET_CLUBHOUSE_TOUCHED':
      return { ...state, clubhouseTouched: action.payload };
    case 'SET_FACILITIES_TOUCHED':
      return { ...state, facilitiesTouched: action.payload };
    case 'SET_EXISTING_MEDIA':
      return { ...state, existingMediaItems: action.payload };
    case 'ADD_IMAGES': {
      const newImages = [...state.selectedImages, ...action.payload.files];
      const newPreviews = new Map(state.imagePreviews);
      action.payload.previews.forEach((value, key) => newPreviews.set(key, value));
      return { ...state, selectedImages: newImages, imagePreviews: newPreviews };
    }
    case 'REMOVE_IMAGE': {
      const newImages = state.selectedImages.filter((_, i) => i !== action.payload.index);
      const newPreviews = new Map(state.imagePreviews);
      newPreviews.delete(action.payload.fileKey);
      return { ...state, selectedImages: newImages, imagePreviews: newPreviews };
    }
    case 'SET_LOCAL_VIDEO_POSTERS':
      return { ...state, localVideoPosters: action.payload };
    case 'SET_IS_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_SHOW_CONFIRMATION':
      return { ...state, showConfirmation: action.payload };
    case 'SET_SHOW_REMOVE_DIALOG':
      return { ...state, showRemoveDialog: action.payload };
    case 'SET_SUBMITTED_RATING_ID':
      return { ...state, submittedRatingId: action.payload };
    case 'SET_BUTTON_TEXT':
      return { ...state, buttonText: action.payload };
    case 'SET_IS_DELETED':
      return { ...state, isDeleted: action.payload };
    case 'SET_IS_FADING_OUT':
      return { ...state, isFadingOut: action.payload };
    case 'SET_JUST_ENTERED_EXCEPTIONAL':
      return { ...state, justEnteredExceptional: action.payload };
    case 'SET_BREAKDOWN_EXCEPTIONAL_ENTRY':
      return { ...state, breakdownExceptionalEntry: action.payload };
    case 'POPULATE_FROM_EXISTING': {
      const { rating, media } = action.payload;
      return {
        ...state,
        overallRating: rating.rating,
        reviewText: rating.review || '',
        designScore: rating.design_score,
        conditionScore: rating.condition_score,
        clubhouseScore: rating.clubhouse_score,
        facilitiesScore: rating.facilities_score,
        designTouched: rating.design_score != null,
        conditionTouched: rating.condition_score != null,
        clubhouseTouched: rating.clubhouse_score != null,
        facilitiesTouched: rating.facilities_score != null,
        existingMediaItems: media,
      };
    }
    case 'CLEAR_LOCAL_MEDIA':
      return {
        ...state,
        selectedImages: [],
        imagePreviews: new Map(),
        localVideoPosters: new Map(),
      };
    case 'RESET_FORM': {
      const keepEditData = action.payload?.keepEditData ?? false;
      if (keepEditData) {
        // Only reset UI state and local media, keep rating data
        return {
          ...state,
          selectedImages: [],
          imagePreviews: new Map(),
          localVideoPosters: new Map(),
          existingMediaItems: [],
          showConfirmation: false,
          submittedRatingId: null,
          isSubmitting: false,
        };
      }
      return { ...initialState };
    }
    default:
      return state;
  }
}

export interface UseRatingFormStateOptions {
  isEditMode?: boolean;
  existingRating?: any;
}

export function useRatingFormState(options: UseRatingFormStateOptions = {}) {
  const { isEditMode = false, existingRating } = options;
  const [state, dispatch] = useReducer(ratingFormReducer, initialState);
  
  // Track previous tier for exceptional gold-glow animation
  const prevTierRef = useRef<string | null>(null);
  const prevBreakdownTiersRef = useRef<Record<string, string>>({});
  
  // Refs for cleanup
  const imagePreviewsRef = useRef<Map<string, string>>(new Map());
  const localVideoPostersRef = useRef<Map<string, string>>(new Map());
  
  // Keep refs in sync
  useEffect(() => {
    imagePreviewsRef.current = state.imagePreviews;
  }, [state.imagePreviews]);
  
  useEffect(() => {
    localVideoPostersRef.current = state.localVideoPosters;
  }, [state.localVideoPosters]);
  
  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      localVideoPostersRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);
  
  // Actions
  const setOverallRating = useCallback((rating: number | null) => {
    dispatch({ type: 'SET_OVERALL_RATING', payload: rating });
  }, []);
  
  const setReviewText = useCallback((text: string) => {
    dispatch({ type: 'SET_REVIEW_TEXT', payload: text });
  }, []);
  
  const setBreakdownScore = useCallback((key: 'design' | 'condition' | 'clubhouse' | 'facilities', value: number | null) => {
    const typeMap = {
      design: 'SET_DESIGN_SCORE',
      condition: 'SET_CONDITION_SCORE',
      clubhouse: 'SET_CLUBHOUSE_SCORE',
      facilities: 'SET_FACILITIES_SCORE',
    } as const;
    dispatch({ type: typeMap[key], payload: value });
  }, []);
  
  const setBreakdownTouched = useCallback((key: 'design' | 'condition' | 'clubhouse' | 'facilities', touched: boolean) => {
    const typeMap = {
      design: 'SET_DESIGN_TOUCHED',
      condition: 'SET_CONDITION_TOUCHED',
      clubhouse: 'SET_CLUBHOUSE_TOUCHED',
      facilities: 'SET_FACILITIES_TOUCHED',
    } as const;
    dispatch({ type: typeMap[key], payload: touched });
  }, []);
  
  const setExistingMedia = useCallback((media: ExistingMedia[]) => {
    dispatch({ type: 'SET_EXISTING_MEDIA', payload: media });
  }, []);
  
  const addImages = useCallback((files: File[], previews: Map<string, string>) => {
    dispatch({ type: 'ADD_IMAGES', payload: { files, previews } });
  }, []);
  
  const removeImage = useCallback((index: number, fileKey: string, previewUrl?: string) => {
    // Revoke the object URL to free memory
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    dispatch({ type: 'REMOVE_IMAGE', payload: { index, fileKey } });
  }, []);
  
  const setLocalVideoPosters = useCallback((posters: Map<string, string>) => {
    dispatch({ type: 'SET_LOCAL_VIDEO_POSTERS', payload: posters });
  }, []);
  
  const setIsSubmitting = useCallback((submitting: boolean) => {
    dispatch({ type: 'SET_IS_SUBMITTING', payload: submitting });
  }, []);
  
  const setShowConfirmation = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_CONFIRMATION', payload: show });
  }, []);
  
  const setShowRemoveDialog = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_REMOVE_DIALOG', payload: show });
  }, []);
  
  const setSubmittedRatingId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SUBMITTED_RATING_ID', payload: id });
  }, []);
  
  const setButtonText = useCallback((text: string) => {
    dispatch({ type: 'SET_BUTTON_TEXT', payload: text });
  }, []);
  
  const setIsDeleted = useCallback((deleted: boolean) => {
    dispatch({ type: 'SET_IS_DELETED', payload: deleted });
  }, []);
  
  const setIsFadingOut = useCallback((fading: boolean) => {
    dispatch({ type: 'SET_IS_FADING_OUT', payload: fading });
  }, []);
  
  const setJustEnteredExceptional = useCallback((entered: boolean) => {
    dispatch({ type: 'SET_JUST_ENTERED_EXCEPTIONAL', payload: entered });
  }, []);
  
  const setBreakdownExceptionalEntry = useCallback((entry: Record<string, boolean>) => {
    dispatch({ type: 'SET_BREAKDOWN_EXCEPTIONAL_ENTRY', payload: entry });
  }, []);
  
  const populateFromExisting = useCallback((rating: any, media: ExistingMedia[]) => {
    dispatch({ type: 'POPULATE_FROM_EXISTING', payload: { rating, media } });
  }, []);
  
  const clearLocalMedia = useCallback(() => {
    // Revoke blob URLs before clearing
    state.imagePreviews.forEach((url) => {
      if (typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    state.localVideoPosters.forEach((url) => {
      if (typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    dispatch({ type: 'CLEAR_LOCAL_MEDIA' });
  }, [state.imagePreviews, state.localVideoPosters]);
  
  const resetForm = useCallback((keepEditData?: boolean) => {
    // Cleanup previews first
    state.imagePreviews.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    dispatch({ type: 'RESET_FORM', payload: { keepEditData } });
  }, [state.imagePreviews]);
  
  // Derived state
  const totalMediaCount = state.existingMediaItems.length + state.selectedImages.length;
  const isFormValid = state.overallRating !== null;
  const isFormDirty = state.overallRating !== null || state.reviewText.length > 0;
  
  return {
    state,
    dispatch,
    
    // Actions
    setOverallRating,
    setReviewText,
    setBreakdownScore,
    setBreakdownTouched,
    setExistingMedia,
    addImages,
    removeImage,
    setLocalVideoPosters,
    setIsSubmitting,
    setShowConfirmation,
    setShowRemoveDialog,
    setSubmittedRatingId,
    setButtonText,
    setIsDeleted,
    setIsFadingOut,
    setJustEnteredExceptional,
    setBreakdownExceptionalEntry,
    populateFromExisting,
    clearLocalMedia,
    resetForm,
    
    // Refs for animation tracking
    prevTierRef,
    prevBreakdownTiersRef,
    
    // Derived state
    totalMediaCount,
    isFormValid,
    isFormDirty,
  };
}
