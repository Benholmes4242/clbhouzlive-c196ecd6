/**
 * Global video audio mutex
 * Ensures only one video source plays audio at a time across the entire app.
 * All video surfaces must register here and call pauseAllExcept() before unmuting.
 */

type PauseCallback = () => void;

const registry = new Map<string, PauseCallback>();

/** Register a video surface with a callback that pauses/mutes it */
export function registerAudioSource(id: string, pauseFn: PauseCallback): void {
  registry.set(id, pauseFn);
}

/** Unregister when component unmounts */
export function unregisterAudioSource(id: string): void {
  registry.delete(id);
}

/**
 * Pause all registered audio sources except the one with the given ID.
 * Call this before unmuting any video.
 */
export function pauseAllExcept(exceptId: string): void {
  for (const [id, pauseFn] of registry) {
    if (id !== exceptId) {
      try { pauseFn(); } catch { /* silent */ }
    }
  }
}

/**
 * Pause ALL registered audio sources.
 * Call this when opening any overlay or navigating away.
 */
export function pauseAllAudio(): void {
  for (const pauseFn of registry.values()) {
    try { pauseFn(); } catch { /* silent */ }
  }
}
