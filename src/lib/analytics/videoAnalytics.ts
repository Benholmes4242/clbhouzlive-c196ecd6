// PR-5 backlog marker: this stub is a no-op with a single believer (MiniPlayer).
// It lives inside the Continue Watching engine-migration blast radius (see PR-5 ship
// summary) and will be deleted alongside videoQueueStore's playback state when
// MiniPlayer moves onto an engine-managed lane. Do not treat this as functional.
export function trackVideoCloseMini(_videoId?: string, _currentTime?: number): void {
  // no-op analytics stub
}
