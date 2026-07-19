// GlobalPostComposer - App-level portal, mounting the Stage composer.
// Rendered only when usePostStudioStore.isOpen is true; the Stage itself
// is a fixed-position overlay so the mount/unmount is the open/close.
//
// Edit mode + draft deep-link are threaded through to StageComposer. The
// legacy initialMedia hand-off is no longer used by any live opener.
//
// This file and types.ts are the only survivors of the retired post-composer module; the rest was deleted 2026-07-19.

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StageComposer from '@/features/post-v2/StageComposer';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

export function GlobalPostComposer() {
  const {
    isOpen,
    returnPath,
    editPostId,
    draftId,
    closePostStudio,
  } = usePostStudioStore();
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    closePostStudio();
    if (returnPath && returnPath !== window.location.pathname) {
      navigate(returnPath);
    }
  }, [closePostStudio, navigate, returnPath]);

  if (!isOpen) return null;

  return (
    <StageComposer
      onClose={handleClose}
      editPostId={editPostId}
      draftId={draftId}
    />
  );
}

export default GlobalPostComposer;
