/**
 * Video Debug Flags
 * 
 * Set any of these to true to enable detailed logging for that subsystem.
 * All should be false in production.
 * 
 * To enable debugging in production without a redeploy, you can also check:
 * localStorage.getItem('VIDEO_DEBUG_<category>') === 'true'
 */

const isDev = import.meta.env.DEV;

// Check localStorage for runtime debug overrides
const getDebugFlag = (category: string): boolean => {
  if (isDev) return false; // In dev, use the hardcoded flags below
  try {
    return localStorage.getItem(`VIDEO_DEBUG_${category}`) === 'true';
  } catch {
    return false;
  }
};

export const VIDEO_DEBUG = {
  // Bootstrap sequence logging
  bootstrap: false || getDebugFlag('bootstrap'),
  
  // Network priority manager logging
  networkPriority: false || getDebugFlag('networkPriority'),
  
  // Decoder limit manager logging
  decoderLimit: false || getDebugFlag('decoderLimit'),
  
  // Gapless loop logging
  gaplessLoop: false || getDebugFlag('gaplessLoop'),
  
  // HLS events (level switch, fragment loaded)
  hlsEvents: false || getDebugFlag('hlsEvents'),
  
  // Keep-alive activation logging
  keepAlive: false || getDebugFlag('keepAlive'),
  
  // HLS Pool Manager logging
  hlsPool: false || getDebugFlag('hlsPool'),
} as const;

export type VideoDebugCategory = keyof typeof VIDEO_DEBUG;

/**
 * Conditional debug logger for video subsystems
 * Only logs if the category flag is enabled
 */
export function videoDebug(
  category: VideoDebugCategory, 
  message: string, 
  data?: Record<string, any>
): void {
  if (VIDEO_DEBUG[category]) {
    const timestamp = performance.now().toFixed(1);
    const prefix = `[${category}:${timestamp}ms]`;
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}

/**
 * Enable a debug category at runtime (useful for production debugging)
 * Call from browser console: enableVideoDebug('bootstrap')
 */
if (typeof window !== 'undefined') {
  (window as any).enableVideoDebug = (category: VideoDebugCategory) => {
    localStorage.setItem(`VIDEO_DEBUG_${category}`, 'true');
    console.log(`Video debug enabled for: ${category}. Refresh to apply.`);
  };

  (window as any).disableVideoDebug = (category: VideoDebugCategory) => {
    localStorage.removeItem(`VIDEO_DEBUG_${category}`);
    console.log(`Video debug disabled for: ${category}. Refresh to apply.`);
  };

  (window as any).listVideoDebugCategories = () => {
    console.log('Available video debug categories:', Object.keys(VIDEO_DEBUG));
  };
}
