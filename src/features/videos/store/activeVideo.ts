// Global active video store - ensures only one video plays at a time
let active: HTMLVideoElement | null = null;

export function setActiveVideo(el: HTMLVideoElement | null) {
  if (active && active !== el) active.pause();
  active = el;
}

export function getActiveVideo() {
  return active;
}
