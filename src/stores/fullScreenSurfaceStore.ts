// A GENERAL "a full-screen surface is open" flag.
//
// WHY THIS EXISTS: surfaces that render inside the React tree (the post
// composer, the review composer overlay) are confined to whatever stacking
// context an ancestor creates, so their large zIndex loses to a small z on an
// element portalled to document.body. Rather than portal every surface, the
// body-level page affordances (currently the back-to-top button) subscribe to
// this flag and RETURN NULL while a surface is open.
//
// It is deliberately general — register any new full-screen surface here rather
// than teaching each affordance about each surface.
import { useEffect } from 'react';
import { create } from 'zustand';

interface FullScreenSurfaceState {
  /** Reference count — nested surfaces are safe. */
  count: number;
  push: () => void;
  pop: () => void;
}

export const useFullScreenSurfaceStore = create<FullScreenSurfaceState>((set) => ({
  count: 0,
  push: () => set((s) => ({ count: s.count + 1 })),
  pop: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));

/** TRUE while any registered full-screen surface is mounted/open. */
export const useIsFullScreenSurfaceOpen = () =>
  useFullScreenSurfaceStore((s) => s.count > 0);

/**
 * Register a full-screen surface. Pass `open` (or omit it for
 * mounted-means-open surfaces). Unmount and back-gesture dismissal both run
 * the cleanup, so the flag always unwinds.
 */
export function useFullScreenSurface(open: boolean = true) {
  useEffect(() => {
    if (!open) return;
    const { push, pop } = useFullScreenSurfaceStore.getState();
    push();
    return () => pop();
  }, [open]);
}
