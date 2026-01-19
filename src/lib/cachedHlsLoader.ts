import Hls, { LoaderContext, LoaderResponse, LoaderStats, LoaderConfiguration, LoaderCallbacks, HlsConfig } from 'hls.js';
import { hlsBlobCache } from '@/utils/hlsBlobCache';

/**
 * Create a custom HLS.js loader that checks the blob cache first
 */
export function createCachedHlsLoader(videoId: string) {
  const DefaultLoader = Hls.DefaultConfig.loader;

  return class CachedHlsLoader {
    private defaultLoader: InstanceType<typeof DefaultLoader>;
    private videoId: string;
    public stats: LoaderStats;
    public context: LoaderContext | null = null;

    constructor(config: HlsConfig) {
      this.defaultLoader = new DefaultLoader(config);
      this.videoId = videoId;
      this.stats = {
        aborted: false,
        loaded: 0,
        total: 0,
        retry: 0,
        chunkCount: 0,
        bwEstimate: 0,
        loading: { start: 0, first: 0, end: 0 },
        parsing: { start: 0, end: 0 },
        buffering: { start: 0, first: 0, end: 0 },
      };
    }

    load(context: LoaderContext, config: LoaderConfiguration, callbacks: LoaderCallbacks<LoaderContext>): void {
      this.context = context;
      const url = context.url;
      
      // Determine request type for logging
      const isSegment = url.includes('.ts') || url.includes('.m4s');
      const isManifest = url.includes('.m3u8');
      
      // Check if this is a segment request and we have it cached
      if (hlsBlobCache.hasSegment(this.videoId, url)) {
        // IMPROVEMENT #8: Silenced verbose cache logs in production
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[CachedHlsLoader] 🎯 CACHE HIT for ${this.videoId.slice(0, 8)} - ${url.slice(-30)}`
          );
        }
        this.loadFromCache(url, context, config, callbacks);
        return;
      }
      
      // Debug: Log cache miss with context (dev only)
      // IMPROVEMENT #8: Silenced verbose cache logs in production
      if (isSegment && process.env.NODE_ENV === 'development') {
        const stats = hlsBlobCache.getStats(this.videoId);
        console.log(
          `[CachedHlsLoader] ❌ CACHE MISS for ${this.videoId.slice(0, 8)} - ${url.slice(-30)} ` +
          `(cache has ${stats?.segmentCount ?? 0} segments, ready: ${stats?.ready ?? false})`
        );
      }

      // Fall back to default loader (network)
      this.defaultLoader.load(context, config, callbacks);
    }

    private async loadFromCache(
      url: string,
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacks<LoaderContext>
    ): Promise<void> {
      const startTime = performance.now();

      try {
        const blob = hlsBlobCache.getSegmentBlob(this.videoId, url);
        
        if (!blob) {
          throw new Error('Blob not found in cache');
        }

        const arrayBuffer = await blob.arrayBuffer();
        const loadTime = performance.now() - startTime;
        
        // IMPROVEMENT #8: Silenced verbose cache logs in production
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[CachedHlsLoader] ✅ Cache HIT ${url.slice(-20)} ` +
            `(${Math.round(blob.size / 1024)}KB in ${Math.round(loadTime)}ms)`
          );
        }

        this.stats = {
          aborted: false,
          loaded: blob.size,
          total: blob.size,
          retry: 0,
          chunkCount: 1,
          bwEstimate: 0,
          loading: { start: startTime, first: startTime, end: performance.now() },
          parsing: { start: 0, end: 0 },
          buffering: { start: 0, first: 0, end: 0 },
        };

        const response: LoaderResponse = {
          url: url,
          data: arrayBuffer,
        };

        callbacks.onSuccess(response, this.stats, context, null);
        
      } catch (error) {
        console.warn(`[CachedHlsLoader] Cache load failed, falling back to network:`, error);
        // Re-run load with default loader
        this.defaultLoader.load(context, config, callbacks);
      }
    }

    abort(): void {
      this.defaultLoader?.abort?.();
    }

    destroy(): void {
      this.defaultLoader?.destroy?.();
    }
  };
}
