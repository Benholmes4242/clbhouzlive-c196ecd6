import { useState, useEffect, useCallback } from 'react';
import { CreateMomentDraft, GolfCourse } from './types';
import { toast } from 'sonner';

const DRAFT_KEY = 'clbhouz_create_moment_draft';
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useDraftPersistence(availableActorIds?: string[]) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<CreateMomentDraft | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraftInternal();
    if (draft) {
      // Check if actor is still available (for creator/business)
      if (draft.actorType !== 'personal' && draft.actorId && availableActorIds) {
        if (!availableActorIds.includes(draft.actorId)) {
          // Actor no longer available - fall back to personal with actor-aware message
          const message = draft.actorType === 'creator'
            ? 'Creator page is no longer available — switched to personal'
            : draft.actorType === 'business'
            ? 'Business profile is no longer available — switched to personal'
            : 'Selected profile is no longer available — switched to personal';
          toast.info(message);
          const fallbackDraft = { ...draft, actorType: 'personal' as const, actorId: undefined };
          setDraftData(fallbackDraft);
          setHasDraft(true);
          return;
        }
      }
      setHasDraft(true);
      setDraftData(draft);
    }
  }, [availableActorIds]);

  // Internal load function
  const loadDraftInternal = (): CreateMomentDraft | null => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return null;

      const draft: CreateMomentDraft = JSON.parse(stored);
      
      // Check if draft has expired
      if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
        localStorage.removeItem(DRAFT_KEY);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  };

  // Public load draft function
  const loadDraft = useCallback((): CreateMomentDraft | null => {
    return loadDraftInternal();
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback((data: {
    caption: string;
    actorType: 'personal' | 'creator' | 'business';
    actorId?: string;
    course?: GolfCourse | null;
    visibility: 'public' | 'private';
  }) => {
    // Only save if there's meaningful content
    if (!data.caption.trim() && !data.course) {
      return;
    }

    try {
      const draft: CreateMomentDraft = {
        caption: data.caption,
        actorType: data.actorType,
        actorId: data.actorId,
        courseId: data.course?.id,
        courseName: data.course?.name,
        courseCountry: data.course?.country,
        visibility: data.visibility,
        savedAt: Date.now(),
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setHasDraft(true);
      setDraftData(draft);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, []);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setDraftData(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, []);

  // Restore draft data to form state
  const restoreDraft = useCallback((): {
    caption: string;
    course: GolfCourse | null;
    visibility: 'public' | 'private';
  } | null => {
    if (!draftData) return null;

    const course: GolfCourse | null = draftData.courseId && draftData.courseName && draftData.courseCountry
      ? {
          id: draftData.courseId,
          name: draftData.courseName,
          country: draftData.courseCountry,
        }
      : null;

    return {
      caption: draftData.caption,
      course,
      visibility: draftData.visibility,
    };
  }, [draftData]);

  return {
    hasDraft,
    draftData,
    loadDraft,
    saveDraft,
    clearDraft,
    restoreDraft,
  };
}
