/**
 * Route chunk loaders — Phase 6 tab-touchstart warm-up.
 *
 * Maps a bottom-nav path -> a function that triggers the lazy chunk's
 * `import()`. Called on `pointerdown` in `NavigationBar`, ~80-150ms before
 * navigation actually happens, so the chunk is parsed by the time
 * `<Suspense>` mounts. This closes the cold-chunk `mounts:0` race in the
 * warm-tap case; the nav-finalize backstop still covers cold cellular.
 *
 * IMPORTANT: keep these `import()` targets in sync with the `lazy(() => ...)`
 * calls in `src/App.tsx`. Vite dedupes on module specifier — reusing the same
 * string means the touchstart fetch and the Suspense fetch share one chunk.
 *
 * `/courses` is intentionally omitted — `CoursesWrapped` is statically
 * imported in App.tsx, so there is no lazy chunk to warm.
 */

export const routeChunkLoaders: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Clubhouse'),
  '/clubhouse': () => import('@/pages/Clubhouse'),
  '/watch': () => import('@/features/watch-v2/WatchHubV2'),
  '/tourhub': () => import('@/features/tourhub/pages'),
  '/notificationmessages': () => import('@/features/activity-v2/ActivityPageV2'),
};

/** Safe fire-and-forget: never throws, never blocks the caller. */
export function warmChunk(path: string): void {
  const loader = routeChunkLoaders[path];
  if (!loader) return;
  try {
    void loader().catch(() => {
      // Silent — the real Suspense mount will surface any error.
    });
  } catch {
    /* noop */
  }
}
