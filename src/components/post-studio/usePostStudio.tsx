// Post Studio — State Machine
// Single useReducer + React Context for the entire studio

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { StudioEdits } from '@/types/studio';
import type {
  PostStudioState,
  PostStudioAction,
  StudioStep,
  StudioActorType,
  StudioMediaItem,
  MentionToken,
  TaggedCourse,
  PostType,
  StudioVisibility,
  PanelId,
} from './types';
import { createInitialState } from './types';
import { POST_LIMITS } from './constants';

// ============================================================================
// REDUCER
// ============================================================================

function postStudioReducer(state: PostStudioState, action: PostStudioAction): PostStudioState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        previousStep: state.step,
        step: action.payload,
        isDirty: action.payload === 'SUCCESS' ? false : state.isDirty,
      };

    case 'SET_ACTOR':
      return {
        ...state,
        actorType: action.payload.actorType,
        actorId: action.payload.actorId,
        isDirty: true,
      };

    case 'ADD_MEDIA': {
      const currentCount = state.mediaItems.length;
      const remaining = POST_LIMITS.MAX_MEDIA_COUNT - currentCount;
      const toAdd = action.payload.slice(0, Math.max(0, remaining));
      if (toAdd.length === 0) return state;
      return {
        ...state,
        mediaItems: [...state.mediaItems, ...toAdd],
        isDirty: true,
      };
    }

    case 'REMOVE_MEDIA': {
      const filtered = state.mediaItems.filter((m) => m.id !== action.payload);
      const newIndex = Math.min(state.activeMediaIndex, Math.max(0, filtered.length - 1));
      return {
        ...state,
        mediaItems: filtered,
        activeMediaIndex: newIndex,
        isDirty: true,
      };
    }

    case 'REORDER_MEDIA': {
      const { fromIndex, toIndex } = action.payload;
      const items = [...state.mediaItems];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...state, mediaItems: items, isDirty: true };
    }

    case 'SET_ACTIVE_MEDIA':
      return {
        ...state,
        activeMediaIndex: Math.max(0, Math.min(action.payload, state.mediaItems.length - 1)),
      };

    case 'UPDATE_MEDIA_TRIM':
      return {
        ...state,
        mediaItems: state.mediaItems.map((m) =>
          m.id === action.payload.id
            ? { ...m, trimStart: action.payload.trimStart, trimEnd: action.payload.trimEnd }
            : m
        ),
        isDirty: true,
      };

    case 'UPDATE_MEDIA_POSTER':
      return {
        ...state,
        mediaItems: state.mediaItems.map((m) =>
          m.id === action.payload.id
            ? {
                ...m,
                posterTimestamp: action.payload.posterTimestamp,
                posterPreviewUrl: action.payload.posterPreviewUrl,
              }
            : m
        ),
        isDirty: true,
      };

    case 'UPDATE_MEDIA_EDITS':
      return {
        ...state,
        mediaItems: state.mediaItems.map((m) =>
          m.id === action.payload.id
            ? { ...m, edits: action.payload.edits }
            : m
        ),
        isDirty: true,
      };

    case 'SET_CAPTION':
      return { ...state, caption: action.payload, isDirty: true };

    case 'SET_MENTIONS':
      return { ...state, mentions: action.payload };

    case 'SET_TAGGED_COURSES':
      return { ...state, taggedCourses: action.payload, isDirty: true };

    case 'SET_POST_TYPE':
      return {
        ...state,
        postType: action.payload,
        reviewRating: action.payload === 'standard' ? null : state.reviewRating,
        isDirty: true,
      };

    case 'SET_REVIEW_RATING':
      return { ...state, reviewRating: action.payload, isDirty: true };

    case 'SET_VISIBILITY':
      return { ...state, visibility: action.payload, isDirty: true };

    case 'SET_SCHEDULED_AT':
      return { ...state, scheduledAt: action.payload, isDirty: true };

    case 'LOAD_DRAFT':
      return {
        ...createInitialState(),
        ...action.payload.state,
        draftId: action.payload.draftId,
        isDirty: false,
      };

    case 'MARK_DIRTY':
      return { ...state, isDirty: true };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    case 'SET_DISCARDING':
      return { ...state, isDiscarding: action.payload };

    case 'OPEN_PANEL':
      return { ...state, activePanelId: action.payload };

    case 'CLOSE_PANEL':
      return { ...state, activePanelId: null };

    case 'RESET':
      return createInitialState();

    case 'SET_MENTION_TRIGGER':
      return { ...state, mentionTriggerIndex: action.payload };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface PostStudioContextValue {
  state: PostStudioState;
  dispatch: React.Dispatch<PostStudioAction>;

  // Convenience action creators
  setStep: (step: StudioStep) => void;
  setActor: (actorType: StudioActorType, actorId: string | null) => void;
  addMedia: (items: StudioMediaItem[]) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (fromIndex: number, toIndex: number) => void;
  setActiveMedia: (index: number) => void;
  updateTrim: (id: string, trimStart: number, trimEnd: number) => void;
  updatePoster: (id: string, posterTimestamp: number, posterPreviewUrl: string | null) => void;
  updateMediaEdits: (id: string, edits: StudioEdits) => void;
  setCaption: (text: string) => void;
  setMentions: (mentions: MentionToken[]) => void;
  setTaggedCourses: (courses: TaggedCourse[]) => void;
  setPostType: (type: PostType) => void;
  setReviewRating: (rating: number | null) => void;
  setVisibility: (visibility: StudioVisibility) => void;
  setScheduledAt: (date: Date | null) => void;
  openPanel: (panelId: PanelId) => void;
  closePanel: () => void;
  setDiscarding: (value: boolean) => void;
  setMentionTriggerIndex: (index: number) => void;
  reset: () => void;
  onSuccess?: (postId: string) => void;
  publishRef: React.MutableRefObject<(() => void) | null>;
}

const PostStudioContext = createContext<PostStudioContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface PostStudioProviderProps {
  children: React.ReactNode;
  initialActorType?: StudioActorType;
  initialActorId?: string;
  onSuccess?: (postId: string) => void;
}

export function PostStudioProvider({
  children,
  initialActorType,
  initialActorId,
  onSuccess,
}: PostStudioProviderProps) {
  const [state, dispatch] = useReducer(
    postStudioReducer,
    createInitialState({
      actorType: initialActorType ?? 'personal',
      actorId: initialActorId ?? null,
    })
  );

  // Stable action creators
  const setStep = useCallback((step: StudioStep) => dispatch({ type: 'SET_STEP', payload: step }), []);
  const setActor = useCallback((actorType: StudioActorType, actorId: string | null) => dispatch({ type: 'SET_ACTOR', payload: { actorType, actorId } }), []);
  const addMedia = useCallback((items: StudioMediaItem[]) => dispatch({ type: 'ADD_MEDIA', payload: items }), []);
  const removeMedia = useCallback((id: string) => dispatch({ type: 'REMOVE_MEDIA', payload: id }), []);
  const reorderMedia = useCallback((fromIndex: number, toIndex: number) => dispatch({ type: 'REORDER_MEDIA', payload: { fromIndex, toIndex } }), []);
  const setActiveMedia = useCallback((index: number) => dispatch({ type: 'SET_ACTIVE_MEDIA', payload: index }), []);
  const updateTrim = useCallback((id: string, trimStart: number, trimEnd: number) => dispatch({ type: 'UPDATE_MEDIA_TRIM', payload: { id, trimStart, trimEnd } }), []);
  const updatePoster = useCallback((id: string, posterTimestamp: number, posterPreviewUrl: string | null) => dispatch({ type: 'UPDATE_MEDIA_POSTER', payload: { id, posterTimestamp, posterPreviewUrl } }), []);
  const updateMediaEdits = useCallback(
    (id: string, edits: StudioEdits) =>
      dispatch({ type: 'UPDATE_MEDIA_EDITS', payload: { id, edits } }),
    []
  );
  const setCaption = useCallback((text: string) => dispatch({ type: 'SET_CAPTION', payload: text }), []);
  const setMentions = useCallback((mentions: MentionToken[]) => dispatch({ type: 'SET_MENTIONS', payload: mentions }), []);
  const setTaggedCourses = useCallback((courses: TaggedCourse[]) => dispatch({ type: 'SET_TAGGED_COURSES', payload: courses }), []);
  const setPostType = useCallback((type: PostType) => dispatch({ type: 'SET_POST_TYPE', payload: type }), []);
  const setReviewRating = useCallback((rating: number | null) => dispatch({ type: 'SET_REVIEW_RATING', payload: rating }), []);
  const setVisibility = useCallback((visibility: StudioVisibility) => dispatch({ type: 'SET_VISIBILITY', payload: visibility }), []);
  const setScheduledAt = useCallback((date: Date | null) => dispatch({ type: 'SET_SCHEDULED_AT', payload: date }), []);
  const openPanel = useCallback((panelId: PanelId) => dispatch({ type: 'OPEN_PANEL', payload: panelId }), []);
  const closePanel = useCallback(() => dispatch({ type: 'CLOSE_PANEL' }), []);
  const setDiscarding = useCallback((value: boolean) => dispatch({ type: 'SET_DISCARDING', payload: value }), []);
  const setMentionTriggerIndex = useCallback((index: number) => dispatch({ type: 'SET_MENTION_TRIGGER', payload: index }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = useMemo<PostStudioContextValue>(
    () => ({
      state,
      dispatch,
      setStep,
      setActor,
      addMedia,
      removeMedia,
      reorderMedia,
      setActiveMedia,
      updateTrim,
      updatePoster,
      updateMediaEdits,
      setCaption,
      setMentions,
      setTaggedCourses,
      setPostType,
      setReviewRating,
      setVisibility,
      setScheduledAt,
      openPanel,
      closePanel,
      setDiscarding,
      setMentionTriggerIndex,
      reset,
      onSuccess,
    }),
    [
      state,
      dispatch,
      setStep,
      setActor,
      addMedia,
      removeMedia,
      reorderMedia,
      setActiveMedia,
      updateTrim,
      updatePoster,
      updateMediaEdits,
      setCaption,
      setMentions,
      setTaggedCourses,
      setPostType,
      setReviewRating,
      setVisibility,
      setScheduledAt,
      openPanel,
      closePanel,
      setDiscarding,
      setMentionTriggerIndex,
      reset,
      onSuccess,
    ]
  );

  return (
    <PostStudioContext.Provider value={value}>
      {children}
    </PostStudioContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function usePostStudioContext(): PostStudioContextValue {
  const ctx = useContext(PostStudioContext);
  if (!ctx) {
    throw new Error('usePostStudioContext must be used within <PostStudioProvider>');
  }
  return ctx;
}
