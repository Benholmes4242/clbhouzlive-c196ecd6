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

  openPostStudio: (opts) =>
    set({
      isOpen: true,
      initialMedia: opts?.media ?? [],
      initialActorType: opts?.actorType ?? 'personal',
      initialActorId: opts?.actorId ?? null,
      returnPath: opts?.returnPath ?? window.location.pathname,
      editPostId: null,
    }),

  openPostStudioForEdit: (opts) =>
    set({
      isOpen: true,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: opts.returnPath ?? window.location.pathname,
      editPostId: opts.postId,
    }),

  closePostStudio: () =>
    set({
      isOpen: false,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: '/',
      editPostId: null,
    }),
}));

// Dev-only console hook so Brief 2A can be exercised end-to-end before the
// PostOwnerMenu (Track C) wires up a real entry point.
// Usage in DevTools: window.__openPostStudioForEdit('<postId>')
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__openPostStudioForEdit = (
    postId: string,
  ) => usePostStudioStore.getState().openPostStudioForEdit({ postId });
}
