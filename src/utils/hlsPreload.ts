/**
 * HLS Preloading Utility
 * Preloads HLS manifests and first segments to reduce autoplay delay
 * Now uses explicit blob cache instead of relying on browser HTTP cache
 */

import { prefetchDebug } from './prefetch-debug';
import { hlsBlobCache } from './hlsBlobCache';
import { extractCloudflareUid } from './videoIdUtils';

/**
 * Preloads both the manifest and attempts to preload the first TWO segments.
 * Uses explicit blob cache for reliable handoff to HLS.js player.
 */
export const preloadHlsManifest = async (hlsUrl: string, videoId?: string): Promise<void> => {
  // CRITICAL: Use extractCloudflareUid for consistent cache keys
  const effectiveVideoId = videoId || extractCloudflareUid(hlsUrl) || 'unknown';
  prefetchDebug.prefetchInitiated(effectiveVideoId, hlsUrl);
  
  try {
    // Fetch manifest
    const manifestResponse = await fetch(hlsUrl, { 
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!manifestResponse.ok) {
      prefetchDebug.prefetchFailed(effectiveVideoId, `Manifest fetch failed: ${manifestResponse.status}`);
      return;
    }
    
    const fromCache = manifestResponse.headers.get('x-cache') === 'HIT';
    prefetchDebug.manifestLoaded(effectiveVideoId, fromCache);
    
    const manifestText = await manifestResponse.text();
    
    // Store manifest in blob cache
    hlsBlobCache.storeManifest(effectiveVideoId, hlsUrl, manifestText);
    
    // Parse manifest to find segment URLs
    const lines = manifestText.split('\n');
    const segmentLines = lines.filter(line => 
      (line.endsWith('.ts') || line.endsWith('.m4s') || line.includes('.ts?')) && 
      !line.startsWith('#')
    );
    
    if (segmentLines.length === 0) {
      // This might be a master playlist - need to fetch the variant playlist first
      const variantLine = lines.find(line => line.endsWith('.m3u8') && !line.startsWith('#'));
      if (variantLine) {
        const variantUrl = new URL(variantLine.trim(), hlsUrl).href;
        
        // Fetch variant playlist
        const variantResponse = await fetch(variantUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (variantResponse.ok) {
          const variantText = await variantResponse.text();
          
          // Store variant manifest too
          hlsBlobCache.storeManifest(effectiveVideoId, variantUrl, variantText);
          
          const variantLines = variantText.split('\n');
          const variantSegments = variantLines.filter(line => 
            (line.endsWith('.ts') || line.endsWith('.m4s') || line.includes('.ts?')) && 
            !line.startsWith('#')
          );
          
          if (variantSegments.length > 0) {
            // Preload first two segments in parallel
            const segmentsToPreload = variantSegments.slice(0, 2);
            await preloadSegments(segmentsToPreload, variantUrl, effectiveVideoId);
            
            // Mark as ready in blob cache
            hlsBlobCache.markReady(effectiveVideoId);
            prefetchDebug.prefetchComplete(effectiveVideoId, segmentsToPreload.length);
          }
        }
      }
      return;
    }
    
    // Preload first two segments in parallel
    const segmentsToPreload = segmentLines.slice(0, 2);
    await preloadSegments(segmentsToPreload, hlsUrl, effectiveVideoId);
    
    // Mark as ready in blob cache
    hlsBlobCache.markReady(effectiveVideoId);
    prefetchDebug.prefetchComplete(effectiveVideoId, segmentsToPreload.length);
    
  } catch (err) {
    prefetchDebug.prefetchFailed(effectiveVideoId, err instanceof Error ? err.message : 'Unknown error');
  }
};

/**
 * Preload multiple segments in parallel and store in blob cache
 */
async function preloadSegments(
  segmentLines: string[], 
  baseUrl: string, 
  videoId: string
): Promise<void> {
  const segmentPromises = segmentLines.map(async (segmentLine, index) => {
    try {
      const segmentUrl = new URL(segmentLine.trim(), baseUrl).href;
      
      // Log the URL being stored for debugging
      console.log(`[hlsPreload] Storing segment ${index} for ${videoId.slice(0, 8)}: ${segmentUrl.slice(-50)}`);
      
      const segmentResponse = await fetch(segmentUrl, { 
        method: 'GET', 
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (segmentResponse.ok) {
        // Store in blob cache
        await hlsBlobCache.storeSegment(videoId, segmentUrl, segmentResponse);
        
        const fromCache = segmentResponse.headers.get('x-cache') === 'HIT';
        const stats = hlsBlobCache.getStats(videoId);
        const size = stats?.totalBytes || 0;
        prefetchDebug.segmentLoaded(videoId, index, fromCache, size);
      }
    } catch {
      // Silently ignore individual segment failures
    }
  });
  
  // Wait for all segments to load
  await Promise.allSettled(segmentPromises);
}
