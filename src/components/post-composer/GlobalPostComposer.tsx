// GlobalPostComposer - mounts the Stage composer and PORTALS IT TO document.body.
//
// The portal is load-bearing, not cosmetic. StageComposer paints
// `position: fixed; inset: 0` roots at POST_COMPOSER_Z, and a z-index ranks an
// element only against its siblings inside its nearest stacking-context
// ancestor. Rendered in place, the composer is clamped by any ancestor that
// establishes a stacking context (transform, will-change, filter, opacity < 1,
// contain, isolation, or the Median WebView wrapper on device) and paints BEHIND
// the page — preview-clean, device-broken. This is the zLayers.ts invariant:
// EVERY FULL-VIEWPORT OVERLAY MUST PORTAL TO document.body. Do not "fix" a
// recurrence by raising the number.
//
// Rendered only when usePostStudioStore.isOpen is true; the Stage itself is a
// fixed-position overlay so the mount/unmount is the open/close. Edit mode +
// draft deep-link are threaded through. The legacy initialMedia hand-off is no
// longer used by any live opener.
//
// This file and types.ts are the only survivors of the retired post-composer module; the rest was deleted 2026-07-19.

import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import StageComposer from '@/features/post-v2/StageComposer';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useFullScreenSurface } from '@/stores/fullScreenSurfaceStore';

export function GlobalPostComposer() {
  const {
    isOpen,
    returnPath,
    editPostId,
    draftId,
    initialMedia,
    awaitingMedia,
    closePostStudio,
  } = usePostStudioStore();
  const navigate = useNavigate();

  // The composer renders in the React tree, so body-level page affordances
  // (back-to-top) must stand down while it is open.
  useFullScreenSurface(isOpen);

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
      initialMedia={initialMedia}
      awaitingMedia={awaitingMedia}
    />
  );
}

export default GlobalPostComposer;
