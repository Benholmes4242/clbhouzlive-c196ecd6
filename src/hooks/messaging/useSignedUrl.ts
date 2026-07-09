import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'message-media';
const DEFAULT_TTL_SECONDS = 3600;
const REFRESH_BUFFER_MS = 60_000;

interface CacheEntry {
  url: string;
  expiresAt: number;
}

// Module-level cache shared across all hook instances.
const cache = new Map<string, CacheEntry>();
// Dedupe concurrent sign requests for the same path.
const inflight = new Map<string, Promise<string | null>>();

function getCached(path: string): string | null {
  const entry = cache.get(path);
  if (!entry) return null;
  if (entry.expiresAt > Date.now() + REFRESH_BUFFER_MS) return entry.url;
  return null;
}

async function signAndCache(path: string, ttlSeconds: number): Promise<string | null> {
  const existing = inflight.get(path);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, ttlSeconds);
    if (error || !data?.signedUrl) return null;
    cache.set(path, {
      url: data.signedUrl,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return data.signedUrl;
  })().finally(() => {
    inflight.delete(path);
  });

  inflight.set(path, promise);
  return promise;
}

/**
 * Async helper for non-hook contexts. Uses the same module cache.
 * Returns null if signing fails or path is empty.
 */
export async function getSignedUrl(
  path: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string | null> {
  if (!path) return null;
  const cached = getCached(path);
  if (cached) return cached;
  return signAndCache(path, ttlSeconds);
}

export interface UseSignedUrlResult {
  url: string | null;
  loading: boolean;
  error: boolean;
}

export function useSignedUrl(
  path: string | null | undefined,
  opts?: { ttlSeconds?: number },
): UseSignedUrlResult {
  const ttlSeconds = opts?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const initial = path ? getCached(path) : null;
  const [url, setUrl] = useState<string | null>(initial);
  const [loading, setLoading] = useState<boolean>(!!path && !initial);
  const [error, setError] = useState<boolean>(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      setLoading(false);
      setError(false);
      return;
    }
    const cached = getCached(path);
    if (cached) {
      setUrl(cached);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    let cancelled = false;
    signAndCache(path, ttlSeconds).then((signed) => {
      if (cancelled || !mountedRef.current) return;
      if (signed) {
        setUrl(signed);
        setError(false);
      } else {
        setUrl(null);
        setError(true);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [path, ttlSeconds]);

  return { url, loading, error };
}
