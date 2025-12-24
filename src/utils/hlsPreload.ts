/**
 * HLS Preloading Utility
 * Preloads HLS manifests and first segments to reduce autoplay delay
 */

/**
 * Preloads both the manifest and attempts to preload the first segment.
 * This reduces Time To First Frame (TTFF) significantly.
 */
export const preloadHlsManifest = async (hlsUrl: string): Promise<void> => {
  try {
    // Fetch manifest first
    const response = await fetch(hlsUrl, { 
      method: 'GET',
      // Use cors mode so we can read the response for segment parsing
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) return;
    
    const manifestText = await response.text();
    
    // Parse manifest to find first segment URL
    const lines = manifestText.split('\n');
    const firstSegmentLine = lines.find(line => 
      (line.endsWith('.ts') || line.endsWith('.m4s') || line.includes('.ts?')) && 
      !line.startsWith('#')
    );
    
    if (firstSegmentLine) {
      // Construct full segment URL relative to manifest
      const segmentUrl = new URL(firstSegmentLine.trim(), hlsUrl).href;
      
      // Preload first segment in background (don't await)
      fetch(segmentUrl, { 
        method: 'GET', 
        mode: 'cors',
        credentials: 'omit',
      }).catch(() => {
        // Silently ignore segment preload failures
      });
    }
  } catch {
    // Fail silently – this is a best-effort optimisation
  }
};
