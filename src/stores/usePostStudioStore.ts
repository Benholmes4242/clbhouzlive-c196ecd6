// Global open/close state for PostStudio
// Zustand store so any component can trigger it without prop drilling

import { create } from 'zustand';
import type { StudioActorType } from '@/components/post-composer/types';

interface PostStudioStoreState {
  isOpen: boolean;
  initialMedia: File[];
  initialActorType: StudioActorType;
  initialActorId: string | null;
  returnPath: string;
  /** When set, the composer opens in edit mode against this existing post id. */
  editPostId: string | null;
  /** When set, the composer opens by resuming the given draft. */
  draftId: string | null;
  /** C3 "Share this round" — course + round the composer opens pre-filled with. */
  prefillCourse: { id: string; name: string; country: string | null } | null;
  prefillWhsScoreId: string | null;

  /** Open the studio (optionally with pre-selected media or actor) */
  openPostStudio: (opts?: {
    media?: File[];
    actorType?: StudioActorType;
    actorId?: string | null;
    returnPath?: string;
  }) => void;

  /** Open the studio in edit mode for an existing post. */
  openPostStudioForEdit: (opts: {
    postId: string;
    returnPath?: string;
  }) => void;

  /** Open the studio by resuming a saved draft. */
  openPostStudioForDraft: (opts: {
    draftId: string;
    returnPath?: string;
  }) => void;

  /** Open the studio pre-filled with a course and one of the member's rounds. */
  openPostStudioForRound: (opts: {
    course: { id: string; name: string; country?: string | null };
    whsScoreId: string;
    returnPath?: string;
  }) => void;

  /** Close the studio and reset trigger state */
  closePostStudio: () => void;
}

export const usePostStudioStore = create<PostStudioStoreState>((set) => ({
  isOpen: false,
  initialMedia: [],
  initialActorType: 'personal',
  initialActorId: null,
  returnPath: '/',
  editPostId: null,
  draftId: null,
  prefillCourse: null,
  prefillWhsScoreId: null,

  openPostStudio: (opts) =>
    set({
      isOpen: true,
      initialMedia: opts?.media ?? [],
      initialActorType: opts?.actorType ?? 'personal',
      initialActorId: opts?.actorId ?? null,
      returnPath: opts?.returnPath ?? window.location.pathname,
      editPostId: null,
      draftId: null,
      prefillCourse: null,
      prefillWhsScoreId: null,
    }),

  openPostStudioForEdit: (opts) =>
    set({
      isOpen: true,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: opts.returnPath ?? window.location.pathname,
      editPostId: opts.postId,
      draftId: null,
      prefillCourse: null,
      prefillWhsScoreId: null,
    }),

  openPostStudioForDraft: (opts) =>
    set({
      isOpen: true,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: opts.returnPath ?? window.location.pathname,
      editPostId: null,
      draftId: opts.draftId,
      prefillCourse: null,
      prefillWhsScoreId: null,
    }),

  openPostStudioForRound: (opts) =>
    set({
      isOpen: true,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: opts.returnPath ?? window.location.pathname,
      editPostId: null,
      draftId: null,
      prefillCourse: {
        id: opts.course.id,
        name: opts.course.name,
        country: opts.course.country ?? null,
      },
      prefillWhsScoreId: opts.whsScoreId,
    }),

  closePostStudio: () =>
    set({
      isOpen: false,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: '/',
      editPostId: null,
      draftId: null,
      prefillCourse: null,
      prefillWhsScoreId: null,
    }),
}));

// Dev-only console hooks for QA before UI entry points exist.
// Usage in DevTools:
//   window.__openPostStudioForEdit('<postId>')
//   window.__openPostStudioForDraft('<draftId>')
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  w.__openPostStudioForEdit = (postId: string) =>
    usePostStudioStore.getState().openPostStudioForEdit({ postId });
  w.__openPostStudioForDraft = (draftId: string) =>
    usePostStudioStore.getState().openPostStudioForDraft({ draftId });
}
