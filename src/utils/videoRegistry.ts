/**
 * Lightweight video registry for enforcing exclusivity in Shorts autoplay
 */

const players = new Map<string, HTMLVideoElement>();
let currentId: string | null = null;

export function registerPlayer(id: string, video: HTMLVideoElement) {
  players.set(id, video);
  return () => {
    players.delete(id);
  };
}

export function pauseAllExcept(id: string) {
  currentId = id;
  players.forEach((v, k) => {
    if (k !== id) {
      try {
        v.pause();
      } catch (e) {
        // Silently fail if pause is not supported
      }
    }
  });
}

export function getCurrentPlayingId() {
  return currentId;
}
