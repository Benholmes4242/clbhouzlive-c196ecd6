// GlobalPostComposer — App-level mount that subscribes to usePostStudioStore.
// Renders <PostComposer/> whenever isOpen is true.

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostComposer } from './PostComposer';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

export function GlobalPostComposer() {
  const {
    isOpen,
    initialMedia,
    initialActorType,
    initialActorId,
    returnPath,
    editPostId,
    closePostStudio,
  } = usePostStudioStore();
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    closePostStudio();
    if (returnPath && returnPath !== window.location.pathname) {
      navigate(returnPath);
    }
  }, [closePostStudio, navigate, returnPath]);

  return (
    <PostComposer
      open={isOpen}
      onClose={handleClose}
      initialMedia={initialMedia}
      initialActorType={initialActorType}
      initialActorId={initialActorId}
      editPostId={editPostId}
    />
  );
}

export default GlobalPostComposer;
