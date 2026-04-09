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

  openPostStudio: (opts) => {
    const path = opts?.returnPath ?? window.location.pathname;
    console.log('[DEBUG] openPostStudio called, capturing returnPath:', path);
    set({
      isOpen: true,
      initialMedia: opts?.media ?? [],
      initialActorType: opts?.actorType ?? 'personal',
      initialActorId: opts?.actorId ?? null,
      returnPath: path,
    });
  },

  closePostStudio: () =>
    set({
      isOpen: false,
      initialMedia: [],
      initialActorType: 'personal',
      initialActorId: null,
      returnPath: '/',
    }),
}));
