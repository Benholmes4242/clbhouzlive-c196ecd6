import { useRef, useCallback } from 'react';
import type { VideoSessionState } from '../types/media';

/**
 * Session cache for preserving video playback state across pool recycling.
 * Persists for the page session — back-navigation is instant.
 */
export function useSessionCache() {
  const cacheRef = useRef<Map<string, VideoSessionState>>(new Map());

  const save = useCallback((url: string, state: VideoSessionState) => {
    cacheRef.current.set(url, state);
  }, []);

  const restore = useCallback((url: string): VideoSessionState | null => {
    return cacheRef.current.get(url) ?? null;
  }, []);

  const has = useCallback((url: string): boolean => {
    return cacheRef.current.has(url);
  }, []);

  return { save, restore, has };
}
