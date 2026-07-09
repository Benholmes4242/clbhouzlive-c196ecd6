import { useEffect, useRef, useState } from 'react';
import { getSignedUrl } from './useSignedUrl';

export interface UseSignedUrlsResult {
  urls: (string | null)[];
  loading: boolean;
}

/**
 * Batch variant of useSignedUrl. Preserves input order.
 * Shares the module-level cache from useSignedUrl.
 */
export function useSignedUrls(
  paths: (string | null | undefined)[],
  opts?: { ttlSeconds?: number },
): UseSignedUrlsResult {
  const ttlSeconds = opts?.ttlSeconds ?? 3600;
  const [urls, setUrls] = useState<(string | null)[]>(() =>
    paths.map(() => null),
  );
  const [loading, setLoading] = useState<boolean>(paths.some((p) => !!p));
  const mountedRef = useRef(true);

  // Stable key of paths to reduce churn when parent re-renders with same list.
  const key = paths.map((p) => p ?? '').join('|');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (paths.length === 0) {
      setUrls([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      paths.map((p) => (p ? getSignedUrl(p, ttlSeconds) : Promise.resolve(null))),
    ).then((resolved) => {
      if (cancelled || !mountedRef.current) return;
      setUrls(resolved);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttlSeconds]);

  return { urls, loading };
}
