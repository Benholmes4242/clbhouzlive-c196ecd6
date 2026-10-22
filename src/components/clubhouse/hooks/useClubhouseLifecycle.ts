/**
 * App-lifecycle side effects for the Clubhouse feed.
 *
 * CB49: this hook is now EMPTY and kept on purpose (reported, not deleted).
 * - Screen wake lock moved to the app-root `useVideoWakeLock`
 *   (src/video/useVideoWakeLock.ts), driven by VideoEngine's any-lane-playing
 *   aggregate, so the screen stays awake only while a video plays, on every
 *   surface — not for as long as Clubhouse is mounted.
 * - Video visibility pause/resume lives in VideoEngine (CB48).
 */
export function useClubhouseLifecycle(
  _getStore?: () => { userPaused: boolean }
) {
  /* intentionally empty — see header */
}
