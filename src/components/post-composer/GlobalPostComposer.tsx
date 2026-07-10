// GlobalPostComposer - App-level portal, now mounting the Stage composer.
// Rendered only when usePostStudioStore.isOpen is true; the Stage itself
// is a fixed-position overlay so the mount/unmount is the open/close.
//
// P4 cutover note: initialMedia, editPostId, and draftId used to route into
// the legacy PostComposer's edit/draft paths. The Stage doesn't yet support
// those flows - we warn and open a fresh Stage. P5 folds the missing paths
// into the Stage (or its sheets) before deleting the old tree.

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StageComposer from '@/features/post-v2/StageComposer';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

export function GlobalPostComposer() {
  const {
    isOpen,
    returnPath,
    editPostId,
    draftId,
    initialMedia,
    closePostStudio,
  } = usePostStudioStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    if (editPostId) {
      console.warn('[post-v2] edit mode not yet supported by Stage composer; opening a fresh composer', { editPostId });
    }
    if (draftId) {
      console.warn('[post-v2] deep-link draft resume not yet supported; use the in-composer Drafts sheet', { draftId });
    }
    if (initialMedia && initialMedia.length > 0) {
      console.warn('[post-v2] initialMedia hand-off not yet wired into Stage composer; open, then add via the tray');
    }
  }, [isOpen, editPostId, draftId, initialMedia]);

  const handleClose = useCallback(() => {
    closePostStudio();
    if (returnPath && returnPath !== window.location.pathname) {
      navigate(returnPath);
    }
  }, [closePostStudio, navigate, returnPath]);

  if (!isOpen) return null;

  return <StageComposer onClose={handleClose} />;
}

export default GlobalPostComposer;
