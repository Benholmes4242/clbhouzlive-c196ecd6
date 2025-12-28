/**
 * Blob URL Debugging Utilities
 * 
 * Add to your dev tools console for testing blob URL lifecycle and video state.
 * These utilities are only available in development mode.
 */

// Debug: List all video elements and their blob URL states
export function debugBlobUrls(): void {
  const videos = document.querySelectorAll('video');
  console.group('🎬 Video Elements Debug');
  
  videos.forEach((video: HTMLVideoElement, index) => {
    const mediaId = video.dataset.runtimeMediaId || `unknown-${index}`;
    const readyStateNames = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
    const networkStateNames = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'];
    
    console.log({
      mediaId,
      src: video.src?.slice(0, 50) + (video.src?.length > 50 ? '...' : ''),
      isBlob: video.src?.startsWith('blob:'),
      readyState: video.readyState,
      readyStateName: readyStateNames[video.readyState],
      networkState: video.networkState,
      networkStateName: networkStateNames[video.networkState],
      paused: video.paused,
      currentTime: video.currentTime?.toFixed(2),
      duration: video.duration?.toFixed(2),
      error: video.error ? {
        code: video.error.code,
        message: video.error.message
      } : null,
      formatError: video.getAttribute('data-format-error'),
      autoplayBlocked: video.getAttribute('data-autoplay-blocked'),
    });
  });
  
  console.groupEnd();
}

// Test if a blob URL is still valid
export async function testBlobUrl(blobUrl: string): Promise<boolean> {
  try {
    const response = await fetch(blobUrl, { method: 'HEAD' });
    console.log(`Blob URL valid: ${response.ok}`, response.status);
    return response.ok;
  } catch (error) {
    console.log('Blob URL invalid:', error);
    return false;
  }
}

// Test all video blob URLs
export async function testAllBlobUrls(): Promise<void> {
  const videos = document.querySelectorAll('video');
  console.group('🔍 Blob URL Validation');
  
  for (const video of videos) {
    const vid = video as HTMLVideoElement;
    const mediaId = vid.dataset.runtimeMediaId || 'unknown';
    
    if (vid.src?.startsWith('blob:')) {
      const isValid = await testBlobUrl(vid.src);
      console.log(`${mediaId}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    } else {
      console.log(`${mediaId}: (not a blob URL)`);
    }
  }
  
  console.groupEnd();
}

// Force regenerate HLS source for a specific video
export function forceRegenerateSource(mediaId: string): void {
  const video = document.querySelector(`video[data-runtime-media-id="${mediaId}"]`) as HTMLVideoElement;
  
  if (!video) {
    console.error(`Video with mediaId "${mediaId}" not found`);
    return;
  }
  
  const playerRef = (video as any).__hlsPlayerRef;
  
  if (playerRef?.detach && playerRef?.attach) {
    console.log(`Regenerating HLS source for ${mediaId}...`);
    playerRef.detach();
    setTimeout(() => {
      playerRef.attach();
      console.log(`Source regenerated for ${mediaId}`);
    }, 100);
  } else {
    console.error(`No HLS player ref found for ${mediaId}`);
  }
}

// Attach debug utilities to window in development
if (import.meta.env.DEV) {
  (window as any).debugBlobUrls = debugBlobUrls;
  (window as any).testBlobUrl = testBlobUrl;
  (window as any).testAllBlobUrls = testAllBlobUrls;
  (window as any).forceRegenerateSource = forceRegenerateSource;
  
  console.log('🔧 Blob debug utilities loaded. Available commands:');
  console.log('  - debugBlobUrls() - List all video elements and their states');
  console.log('  - testBlobUrl(url) - Test if a blob URL is valid');
  console.log('  - testAllBlobUrls() - Test all video blob URLs');
  console.log('  - forceRegenerateSource(mediaId) - Force regenerate HLS source');
}
