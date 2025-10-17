// Global coordinator to ensure only one video plays at a time
let currentPlaying: HTMLVideoElement | null = null;

export function requestPlay(v: HTMLVideoElement) {
  if (currentPlaying && currentPlaying !== v) {
    try { 
      currentPlaying.pause(); 
    } catch {}
  }
  currentPlaying = v;
}

export function clearIf(v: HTMLVideoElement) {
  if (currentPlaying === v) {
    currentPlaying = null;
  }
}
