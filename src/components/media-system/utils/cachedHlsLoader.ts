/**
 * CachedHlsLoader — custom hls.js fragment loader that serves
 * prefetched segments from the segmentCache. Falls through to
 * the default loader for uncached segments.
 */
import type HlsType from 'hls.js';
import { segmentCache } from './segmentCache';

export function createCachedLoader(HlsClass: typeof HlsType): typeof HlsType.DefaultConfig['loader'] {
  const DefaultLoader = HlsClass.DefaultConfig.loader;

  class CachedFragmentLoader extends (DefaultLoader as any) {
    constructor(config: any) {
      super(config);
    }

    load(context: any, config: any, callbacks: any): void {
      const url = context.url;

      if (context.type === 'fragment' && segmentCache.has(url)) {
        const blob = segmentCache.get(url);
        if (blob) {
          blob.arrayBuffer().then((buffer) => {
            const response = { url, data: buffer };
            const stats = {
              trequest: performance.now(),
              tfirst: performance.now(),
              tload: performance.now(),
              loaded: buffer.byteLength,
              total: buffer.byteLength,
            };
            callbacks.onSuccess(response, stats, context, null);
          }).catch(() => {
            super.load(context, config, callbacks);
          });
          return;
        }
      }

      super.load(context, config, callbacks);
    }
  }

  return CachedFragmentLoader as any;
}
