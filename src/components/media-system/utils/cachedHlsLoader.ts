/**
 * CachedHlsLoader — custom hls.js loader that serves prefetched
 * segments from segmentCache AND manifests from manifestTextCache.
 * Falls through to the default loader for uncached resources.
 */
import type HlsType from 'hls.js';
import { segmentCache } from './segmentCache';

/** Shared manifest text cache — populated by usePreloader, consumed here */
const _manifestTextCache = new Map<string, string>();

export function getManifestTextCache(): Map<string, string> {
  return _manifestTextCache;
}

export function createCachedLoader(HlsClass: typeof HlsType): typeof HlsType.DefaultConfig['loader'] {
  const DefaultLoader = HlsClass.DefaultConfig.loader;

  class CachedHlsLoader extends (DefaultLoader as any) {
    constructor(config: any) {
      super(config);
    }

    load(context: any, config: any, callbacks: any): void {
      const url = context.url;

      // Serve cached segments (fragment type)
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

      // Serve cached manifests (manifest + level types)
      if ((context.type === 'manifest' || context.type === 'level') && _manifestTextCache.has(url)) {
        const text = _manifestTextCache.get(url)!;
        const encoder = new TextEncoder();
        const data = encoder.encode(text).buffer;
        const response = { url, data };
        const stats = {
          trequest: performance.now(),
          tfirst: performance.now(),
          tload: performance.now(),
          loaded: data.byteLength,
          total: data.byteLength,
        };
        callbacks.onSuccess(response, stats, context, null);
        return;
      }

      super.load(context, config, callbacks);
    }
  }

  return CachedHlsLoader as any;
}
