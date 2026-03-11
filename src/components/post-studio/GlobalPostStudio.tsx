// GlobalPostStudio — App-level mount that subscribes to the zustand store
// Renders PostStudio as a portal whenever isOpen = true

import React from 'react';
import PostStudio from './PostStudio';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

export function GlobalPostStudio() {
  const { isOpen, initialMedia, initialActorType, initialActorId, closePostStudio } =
    usePostStudioStore();

  return (
    <PostStudio
      open={isOpen}
      onClose={closePostStudio}
      initialActorType={initialActorType}
      initialActorId={initialActorId ?? undefined}
      initialMedia={initialMedia}
    />
  );
}
