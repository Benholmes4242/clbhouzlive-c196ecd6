// HLS preload — inert (Stage C, BRIEF_VIDEO_TEARDOWN.md).
// Video prefetch is severed with the engine. Exports preserved as no-ops so
// upstream call sites compile untouched. Image/poster prefetch is unaffected
// (lives in separate utilities).

export const isPrefetchComplete = (_videoId: string): boolean => false;

export const getPrefetchStats = () => ({
  inFlight: 0,
  complete: 0,
  inFlightIds: [] as string[],
});

export const clearPrefetchCache = (_keepUids?: string[]): void => {
  // no-op
};

export const preloadHlsManifest = async (
  _hlsUrl: string,
  _videoId?: string,
  _options?: { signal?: AbortSignal },
): Promise<void> => {
  // no-op
};
