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
      
      // Check if this is a segment request and we have it cached
      if (hlsBlobCache.hasSegment(this.videoId, url)) {
        this.loadFromCache(url, context, callbacks);
        return;
      }

      // Fall back to default loader (network)
      this.defaultLoader.load(context, config, callbacks);
    }

    private async loadFromCache(
      url: string,
      context: LoaderContext,
      callbacks: LoaderCallbacks<LoaderContext>
    ): Promise<void> {
      const startTime = performance.now();

      try {
        const blob = hlsBlobCache.getSegmentBlob(this.videoId, url);
        
        if (!blob) {
          throw new Error('Blob not found in cache');
        }

        const arrayBuffer = await blob.arrayBuffer();

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
        
      } catch {
        // Re-run load with default loader
        this.defaultLoader.load(context, {} as LoaderConfiguration, callbacks);
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
