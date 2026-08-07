import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';


/** True when `data` is a valid react-query infinite-query payload. */
function isInfiniteShape(data: unknown): boolean {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray((data as any).pages) &&
    Array.isArray((data as any).pageParams)
  );
}

/**
 * Keys whose consumers are useInfiniteQuery. A persisted entry under one of
 * these MUST carry { pages, pageParams } or react-query's internal
 * getNextPageParam reads `data.pages.length` off a plain object and throws
 * during getOptimisticResult — i.e. a white screen at hydrate, before any
 * fetch. Restoring nothing costs one refetch; restoring the wrong shape costs
 * the whole app.
 */
const INFINITE_KEY_PREFIXES = [
  'media-feed',
  'friends-feed',
  'watch-feed',
  'videos-feed',
  'community-feed-base',
  'longform-videos-base',
  'clubhouse-explore-shorts',
  'golf-courses-infinite',
];

/**
 * Persisted query cache — IndexedDB backed, throttled, first-page-only.
 *
 * Restore behaviour: PersistQueryClientProvider holds queries in the
 * `restoring` state until hydrate completes (tens of ms from IDB), so we do
 * NOT add extra gating at boot. Once hydrated, children see restored data
 * immediately (paint) and any query with `refetchOnMount: true` will kick a
 * background revalidate (SW-R half 2).
 */
export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get<string>(key).then((v) => v ?? null),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: 'clbhouz-query-cache-v2',
  throttleTime: 1000,
  // First-page trim for infinite queries — persist only pages[0]/pageParams[0]
  // so IDB stays in single-digit MB. Rest refetches on mount.
  serialize: (client) => {
    try {
      const clone = JSON.parse(JSON.stringify(client));
      const queries = clone?.clientState?.queries ?? [];
      for (const q of queries) {
        const data = q?.state?.data;
        if (isInfiniteShape(data)) {
          (data as any).pages = (data as any).pages.slice(0, 1);
          (data as any).pageParams = (data as any).pageParams.slice(0, 1);
        }
      }
      return JSON.stringify(clone);
    } catch {
      return JSON.stringify(client);
    }
  },
  // Restore-side shape gate. The same infinite test that governs serialize now
  // governs hydrate: any entry under an infinite key that is not
  // { pages, pageParams } is DROPPED rather than handed to the observer.
  deserialize: (str) => {
    const client = JSON.parse(str);
    try {
      const queries = client?.clientState?.queries;
      if (!Array.isArray(queries)) return client;
      client.clientState.queries = queries.filter((q: any) => {
        const root = q?.queryKey?.[0];
        if (typeof root !== 'string') return true;
        if (!INFINITE_KEY_PREFIXES.some((p) => root.startsWith(p))) return true;
        const data = q?.state?.data;
        if (data == null) return true; // nothing to misread
        if (isInfiniteShape(data)) return true;
        if (import.meta.env.DEV) {
          console.warn('[queryPersister] dropping non-infinite restored entry:', q.queryKey);
        }
        return false;
      });
    } catch {
      /* fall through with whatever parsed */
    }
    return client;
  },
});


/**
 * Allowlist: nothing persists unless its queryKey[0] starts with one of these.
 * Kept intentionally narrow — auth/session/presence/notification/messaging/
 * moderation/admin/signed-URL/token-adjacent keys must NEVER appear here.
 */
const PERSIST_PREFIXES = [
  // Feeds
  'media-feed',
  'friends-feed',
  'community-feed-base',
  'longform-videos-base',
  'clubhouse-explore-shorts',
  // Watch surface
  'watch-feed',
  'videos-feed',
  'quick-clips-rail',
  'videos-following-rail',
  'watch-of-the-week',
  'video-of-the-week',
  'watch-most-loved-this-week',
  'course-anchored-content',
  'bucket-list',
  'suggested-creators',
  'trending',
  // Courses / Top100 / Tour / Handicap / Profile stats
  'top100',
  'userTop100Courses',
  'allTop100Courses',
  'courses',
  'golf-courses',
  'tour',
  'handicap',
  'profile-sheet-stats',
  
];

const _skippedKeysLogged = new Set<string>();

export const shouldPersistQuery = (query: { queryKey: readonly unknown[]; state?: { data?: unknown } }): boolean => {
  const root = query.queryKey?.[0];
  if (typeof root !== 'string') return false;
  if (!PERSIST_PREFIXES.some((p) => root.startsWith(p))) return false;

  // GUARDRAIL: skip any query whose data is a Map or Set — they don't
  // survive JSON round-tripping and rehydrate as plain objects, causing
  // `.get is not a function` crashes on cold start.
  const data = query.state?.data;
  if (data instanceof Map || data instanceof Set) {
    if (import.meta.env.DEV && !_skippedKeysLogged.has(root)) {
      _skippedKeysLogged.add(root);
      console.log('[queryPersister] skipping Map/Set query:', query.queryKey);
    }
    return false;
  }
  return true;
};

/**
 * Wipe on sign-out / account deletion. Called alongside supabase.auth.signOut
 * so the device is safe to hand over.
 */
export async function removePersistedQueryCache(): Promise<void> {
  try {
    await del('clbhouz-query-cache');
    await del('clbhouz-query-cache-v2');
  } catch {
    /* noop */
  }
}

export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const PERSIST_GC_TIME_MS = 24 * 60 * 60 * 1000;
