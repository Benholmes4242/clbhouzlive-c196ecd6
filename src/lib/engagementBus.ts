/**
 * engagementBus — one-way notification channel from engagementCache to
 * non-React-Query subscribers (e.g. zustand snapshot stores).
 *
 * `patchEngagement` writes to React Query caches AND emits on this bus.
 * Any state holder that caches post engagement outside React Query (today:
 * useFullscreenFeedStore) must subscribe and apply the delta itself via
 * `applyEngagementDelta` so it stays in sync.
 *
 * This is intentionally tiny — no rxjs, no React context, just a Set of
 * listeners. Subscribers are responsible for cleanup if they ever unmount
 * (the fullscreen store is module-scope and lives forever, so it doesn't).
 */

import type { EngagementDelta } from './applyEngagementDelta';

export interface EngagementEvent {
  postId: string;
  delta: EngagementDelta;
}

type Listener = (event: EngagementEvent) => void;

const listeners = new Set<Listener>();

export const engagementBus = {
  on(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  emit(event: EngagementEvent): void {
    // Snapshot the listener set so a subscriber unsubscribing during dispatch
    // doesn't cause iteration weirdness.
    const snapshot = Array.from(listeners);
    for (const fn of snapshot) {
      try {
        fn(event);
      } catch (err) {
        // Bus subscribers must not crash the mutation pipeline. Log and move on.
        console.error('[engagementBus] subscriber threw:', err);
      }
    }
  },
};
