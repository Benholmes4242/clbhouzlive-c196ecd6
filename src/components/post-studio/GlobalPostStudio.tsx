// GlobalPostStudio — App-level mount that subscribes to the zustand store
// Renders PostStudio as a portal whenever isOpen = true

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PostStudio from './PostStudio';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

export function GlobalPostStudio() {
  const { isOpen, initialMedia, initialActorType, initialActorId, returnPath, closePostStudio } =
    usePostStudioStore();
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    closePostStudio();
    navigate(returnPath || '/');
  }, [closePostStudio, navigate, returnPath]);

  return (
    <PostStudio
      open={isOpen}
      onClose={handleClose}
      initialActorType={initialActorType}
      initialActorId={initialActorId ?? undefined}
      initialMedia={initialMedia}
    />
  );
}
