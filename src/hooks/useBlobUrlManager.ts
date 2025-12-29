/**
 * useBlobUrlManager - Manage blob URL lifecycle and prevent premature revocation
 * 
 * Problem: HLS.js creates blob URLs for video segments that can become invalid
 * if revoked too early, causing "Format error" failures during playback.
 * 
 * Solution: Track blob URLs, delay revocation, and detect/retry failed generations.
 */

import { useCallback, useRef } from 'react';

interface BlobUrlState {
  url: string;
  createdAt: number;
  revokedAt?: number;
  failedGenerations: Set<number>;
}

export function useBlobUrlManager() {
  const blobUrlsRef = useRef(new Map<string, BlobUrlState>());

  const registerBlobUrl = useCallback((mediaId: string, blobUrl: string) => {
    const existing = blobUrlsRef.current.get(mediaId);

    // Revoke old blob URL after a delay (to ensure new one is loaded)
    if (existing && existing.url !== blobUrl && !existing.revokedAt) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(existing.url);
        } catch {}
        blobUrlsRef.current.set(mediaId, {
          ...existing,
          revokedAt: Date.now(),
        });
      }, 5000); // 5 second delay
    }

    // Register new blob URL
    blobUrlsRef.current.set(mediaId, {
      url: blobUrl,
      createdAt: Date.now(),
      failedGenerations: existing?.failedGenerations ?? new Set(),
    });

    console.log('[BlobManager] Registered blob URL for', mediaId.slice(0, 8), blobUrl.slice(0, 20) + '...');
  }, []);

  const markGenerationFailed = useCallback((mediaId: string, generation: number) => {
    const state = blobUrlsRef.current.get(mediaId);
    if (state) {
      state.failedGenerations.add(generation);
      console.log(`[BlobManager] Marked generation ${generation} as failed for ${mediaId.slice(0, 8)}`);
    }
  }, []);

  const hasGenerationFailed = useCallback((mediaId: string, generation: number): boolean => {
    const state = blobUrlsRef.current.get(mediaId);
    return state?.failedGenerations.has(generation) ?? false;
  }, []);

  const clearFailures = useCallback((mediaId: string) => {
    const state = blobUrlsRef.current.get(mediaId);
    if (state) {
      state.failedGenerations.clear();
      console.log(`[BlobManager] Cleared failures for ${mediaId.slice(0, 8)}`);
    }
  }, []);

  const cleanup = useCallback((mediaId: string) => {
    const state = blobUrlsRef.current.get(mediaId);
    if (state && !state.revokedAt) {
      try {
        URL.revokeObjectURL(state.url);
      } catch {}
      console.log('[BlobManager] Revoked blob URL for', mediaId.slice(0, 8));
    }
    blobUrlsRef.current.delete(mediaId);
  }, []);

  const cleanupAll = useCallback(() => {
    blobUrlsRef.current.forEach((state, mediaId) => {
      if (!state.revokedAt) {
        try {
          URL.revokeObjectURL(state.url);
        } catch {}
      }
    });
    blobUrlsRef.current.clear();
    console.log('[BlobManager] Cleaned up all blob URLs');
  }, []);

  return {
    registerBlobUrl,
    markGenerationFailed,
    hasGenerationFailed,
    clearFailures,
    cleanup,
    cleanupAll,
  };
}

// Singleton for global access (used by MediaRuntime)
class BlobUrlManagerSingleton {
  private blobUrls = new Map<string, BlobUrlState>();
  private regenerationCounts = new Map<string, number>(); // Track regeneration attempts

  registerBlobUrl(mediaId: string, blobUrl: string) {
    const existing = this.blobUrls.get(mediaId);

    if (existing && existing.url !== blobUrl && !existing.revokedAt) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(existing.url);
        } catch {}
        const current = this.blobUrls.get(mediaId);
        if (current && current.url === existing.url) {
          this.blobUrls.set(mediaId, {
            ...current,
            revokedAt: Date.now(),
          });
        }
      }, 5000);
    }

    this.blobUrls.set(mediaId, {
      url: blobUrl,
      createdAt: Date.now(),
      failedGenerations: existing?.failedGenerations ?? new Set(),
    });
  }

  /**
   * Check if a blob URL is registered for a media ID
   * This is the correct way to validate blob URLs (not HTTP fetch!)
   */
  hasBlobUrl(mediaId: string): boolean {
    const state = this.blobUrls.get(mediaId);
    return state !== undefined && !state.revokedAt;
  }

  /**
   * Get the current blob URL for a media ID
   */
  getBlobUrl(mediaId: string): string | undefined {
    const state = this.blobUrls.get(mediaId);
    return state?.revokedAt ? undefined : state?.url;
  }

  markGenerationFailed(mediaId: string, generation: number) {
    const state = this.blobUrls.get(mediaId);
    if (state) {
      state.failedGenerations.add(generation);
    }
  }

  hasGenerationFailed(mediaId: string, generation: number): boolean {
    const state = this.blobUrls.get(mediaId);
    return state?.failedGenerations.has(generation) ?? false;
  }

  clearFailures(mediaId: string) {
    const state = this.blobUrls.get(mediaId);
    if (state) {
      state.failedGenerations.clear();
    }
    // Also reset regeneration count on success
    this.regenerationCounts.delete(mediaId);
  }

  /**
   * Track regeneration attempts and check if limit exceeded
   */
  incrementRegeneration(mediaId: string): number {
    const current = this.regenerationCounts.get(mediaId) ?? 0;
    const newCount = current + 1;
    this.regenerationCounts.set(mediaId, newCount);
    return newCount;
  }

  getRegenerationCount(mediaId: string): number {
    return this.regenerationCounts.get(mediaId) ?? 0;
  }

  resetRegenerationCount(mediaId: string) {
    this.regenerationCounts.delete(mediaId);
  }

  cleanup(mediaId: string) {
    const state = this.blobUrls.get(mediaId);
    if (state && !state.revokedAt) {
      try {
        URL.revokeObjectURL(state.url);
      } catch {}
    }
    this.blobUrls.delete(mediaId);
    this.regenerationCounts.delete(mediaId);
  }
}

export const BlobUrlManager = new BlobUrlManagerSingleton();
