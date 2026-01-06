/**
 * HLS Preloading Utility
 * Preloads HLS manifests and first segments to reduce autoplay delay
 */

/**
 * Preloads both the manifest and attempts to preload the first TWO segments.
 * Uses aggressive caching and parallel fetches to reduce Time To First Frame (TTFF).
 */
export const preloadHlsManifest = async (hlsUrl: string): Promise<void> => {
  const startTime = performance.now();
  
  try {
    // Fetch manifest with aggressive caching
    const manifestResponse = await fetch(hlsUrl, { 
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache', // Use cache if available
    });
    
    if (!manifestResponse.ok) return;
    
    const manifestText = await manifestResponse.text();
    
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
          cache: 'force-cache',
        });
        
        if (variantResponse.ok) {
          const variantText = await variantResponse.text();
          const variantLines = variantText.split('\n');
          const variantSegments = variantLines.filter(line => 
            (line.endsWith('.ts') || line.endsWith('.m4s') || line.includes('.ts?')) && 
            !line.startsWith('#')
          );
          
          if (variantSegments.length > 0) {
            // Preload first two segments in parallel
            const segmentsToPreload = variantSegments.slice(0, 2);
            await preloadSegments(segmentsToPreload, variantUrl, startTime);
          }
        }
      }
      return;
    }
    
    // Preload first two segments in parallel
    const segmentsToPreload = segmentLines.slice(0, 2);
    await preloadSegments(segmentsToPreload, hlsUrl, startTime);
    
  } catch {
    // Silently ignore preload failures
  }
};

/**
 * Preload multiple segments in parallel
 */
async function preloadSegments(
  segmentLines: string[], 
  baseUrl: string, 
  startTime: number
): Promise<void> {
  const segmentPromises = segmentLines.map(async (segmentLine, index) => {
    try {
      const segmentUrl = new URL(segmentLine.trim(), baseUrl).href;
      
      const segmentResponse = await fetch(segmentUrl, { 
        method: 'GET', 
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache',
      });
      
      if (segmentResponse.ok) {
        // Actually read the body to ensure it's cached
        await segmentResponse.arrayBuffer();
        // Segment loaded log removed for cleaner console
      }
    } catch {
      // Silently ignore individual segment failures
    }
  });
  
  // Wait for all segments to load (but don't block)
  await Promise.allSettled(segmentPromises);
}
