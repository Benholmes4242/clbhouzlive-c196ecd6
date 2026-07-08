import { create } from 'zustand';

/**
 * Creation-overlay close signal.
 *
 * The post composer, review wizard and review bottom sheet all call
 * VideoEngine.pauseAll() on open so no feed lane keeps decoding underneath.
 * The feed's activation effect is keyed on activeIndex change, so after
 * pauseAll the same active card sits paused until the user scrolls.
 *
 * This store surfaces a monotonic bump on every creation-overlay close.
 * The visible feed surface reacts by re-issuing the normal play-intent
 * for the current active card. Rails are unaffected (they use useRailLane
 * with its own visibility handling).
 */
interface CreationOverlayState {
  creationClosedAt: number;
  notifyClosed: () => void;
}

export const useCreationOverlayStore = create<CreationOverlayState>((set) => ({
  creationClosedAt: 0,
  notifyClosed: () => set({ creationClosedAt: Date.now() }),
}));
