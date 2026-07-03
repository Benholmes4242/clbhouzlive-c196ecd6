/**
 * Global video audio mutex — inert (Stage C, BRIEF_VIDEO_TEARDOWN.md).
 *
 * No video plays in the poster-only chassis, so there's nothing to mute/pause.
 * The exports are preserved as no-ops so every caller continues to compile.
 * Rewire to the new engine when it lands.
 */

type PauseCallback = () => void;

export function registerAudioSource(_id: string, _pauseFn: PauseCallback): void {
  // no-op
}

export function unregisterAudioSource(_id: string): void {
  // no-op
}

export function pauseAllExcept(_exceptId: string): void {
  // no-op
}

export function pauseAllAudio(): void {
  // no-op
}
