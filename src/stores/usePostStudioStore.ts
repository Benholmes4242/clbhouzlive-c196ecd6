// Global open/close state for PostStudio
// Zustand store so any component can trigger it without prop drilling

import { create } from 'zustand';
import type { StudioActorType } from '@/components/post-studio/types';

interface PostStudioStoreState {
  isOpen: boolean;
  initialMedia: File[];
  initialActorType: StudioActorType;
  initialActorId: string | null;
  returnPath: string;

  /** Open the studio (optionally with pre-selected media or actor) */
  openPostStudio: (opts?: {
    media?: File[];
    actorType?: StudioActorType;
    actorId?: string | null;
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

  openPostStudio: (opts) =>
    set({
      isOpen: true,
      initialMedia: opts?.media ?? [],
      initialActorType: opts?.actorType ?? 'personal',
      initialActorId: opts?.actorId ?? null,
      returnPath: opts?.returnPath ?? window.location.pathname,
    }),

  closePostStudio: () =>
    set({
      isOpen: false,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: '/',
    }),
}));
