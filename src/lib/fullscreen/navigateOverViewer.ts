/**
 * navigateOverViewer — FOUR_FIXES §3. A sheet that can sit over the fullscreen
 * viewer (LikesSheet, comment author/mention taps) and navigates away must
 * first close the viewer with the navigation-aware close ({ reason:
 * 'navigating' }, the same contract as the caption mention tap) and then
 * navigate on the next animation frame, so the destination mounts on top and
 * Back returns to the page beneath the viewer. With no viewer open it
 * navigates immediately and never touches the store.
 */
import type { NavigateFunction, NavigateOptions } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

export function navigateOverViewer(navigate: NavigateFunction, to: string, options?: NavigateOptions): void {
  const store = useFullscreenFeedStore.getState();
  if (!store.isOpen) {
    navigate(to, options);
    return;
  }
  store.close({ reason: 'navigating' });
  requestAnimationFrame(() => navigate(to, options));
}
