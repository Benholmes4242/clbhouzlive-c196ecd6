// hlsPoolPreloader — inert (Stage C, BRIEF_VIDEO_TEARDOWN.md).
// Pool preload creates hidden <video>+hls.js instances; both are severed.
// Export preserved as a no-op so callers compile unchanged.

export async function registerInPool(
  _hlsUrl: string,
  _surface: 'feed' | 'fullscreen' = 'feed',
): Promise<void> {
  // no-op
}
