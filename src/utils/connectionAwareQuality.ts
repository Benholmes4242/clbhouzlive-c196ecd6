/**
 * Connection-Aware Quality Selection
 * 
 * Proactively sets initial video quality based on network conditions
 * to reduce buffering and improve startup time on slow connections.
 */

// NetworkInformation API types (not all browsers support this)
interface NetworkInformation {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  saveData: boolean;
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  onchange?: () => void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

export interface QualityConfig {
  /** HLS.js startLevel: -1 = auto, 0 = lowest, higher = better quality */
  startLevel: number;
  /** Maximum quality level cap (-1 = no cap) */
  autoLevelCapping: number;
  /** Initial bandwidth estimate in bps */
  abrEwmaDefaultEstimate: number;
}

/**
 * Get the network connection info if available
 */
export function getNetworkConnection(): NetworkInformation | null {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

/**
 * Determine initial quality level based on network conditions
 * Returns -1 for auto-select (best for good connections)
 */
export function getInitialQualityLevel(): number {
  const connection = getNetworkConnection();
  
  if (!connection) {
    // No Network Information API - let HLS.js auto-select
    return -1;
  }
  
  // If user has data saver enabled, force lowest quality
  if (connection.saveData) {
    console.log('[QualitySelection] Data saver enabled - using lowest quality');
    return 0;
  }
  
  const effectiveType = connection.effectiveType;
  
  // Map connection type to quality level
  // Cloudflare Stream typically provides: 240p(0), 360p(1), 480p(2), 720p(3), 1080p(4)
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      console.log('[QualitySelection] 2G detected - forcing 240p');
      return 0; // 240p
    case '3g':
      console.log('[QualitySelection] 3G detected - starting at 360p');
      return 1; // 360p
    case '4g':
    default:
      // Auto-select (allow HD)
      return -1;
  }
}

/**
 * Get complete quality configuration based on network conditions
 */
export function getConnectionAwareQualityConfig(): QualityConfig {
  const connection = getNetworkConnection();
  
  // Default config for unknown/good connections
  const defaultConfig: QualityConfig = {
    startLevel: -1, // Auto-select
    autoLevelCapping: -1, // No cap
    abrEwmaDefaultEstimate: 2_000_000, // 2 Mbps
  };
  
  if (!connection) {
    return defaultConfig;
  }
  
  // Data saver mode - strict limits
  if (connection.saveData) {
    return {
      startLevel: 0,
      autoLevelCapping: 1, // Cap at 360p
      abrEwmaDefaultEstimate: 500_000, // 500 Kbps
    };
  }
  
  const effectiveType = connection.effectiveType;
  
  switch (effectiveType) {
    case 'slow-2g':
      return {
        startLevel: 0,
        autoLevelCapping: 0, // Only 240p
        abrEwmaDefaultEstimate: 100_000, // 100 Kbps
      };
    case '2g':
      return {
        startLevel: 0,
        autoLevelCapping: 1, // Max 360p
        abrEwmaDefaultEstimate: 300_000, // 300 Kbps
      };
    case '3g':
      return {
        startLevel: 1,
        autoLevelCapping: 2, // Max 480p
        abrEwmaDefaultEstimate: 1_000_000, // 1 Mbps
      };
    case '4g':
    default:
      return defaultConfig;
  }
}

/**
 * Check if we should show a slow connection warning
 */
export function isSlowConnection(): boolean {
  const connection = getNetworkConnection();
  if (!connection) return false;
  
  return connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' ||
         connection.saveData === true;
}

/**
 * Subscribe to connection changes (if supported)
 */
export function onConnectionChange(callback: () => void): () => void {
  const connection = getNetworkConnection();
  
  if (!connection) {
    return () => {}; // No-op cleanup
  }
  
  connection.onchange = callback;
  
  return () => {
    if (connection.onchange === callback) {
      connection.onchange = undefined;
    }
  };
}
