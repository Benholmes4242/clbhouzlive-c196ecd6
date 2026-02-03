/**
 * useAdaptivePrefetch - TikTok-level adaptive prefetch configuration
 * 
 * FIX #3: Dynamically adjusts prefetch distance based on:
 * - Network speed (via navigator.connection)
 * - Save-data preference
 * - Battery status
 * - Scroll velocity (fast scrollers need more prefetch)
 * - Device memory constraints
 * 
 * Returns optimal prefetch parameters for the current conditions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logVideoTelemetry } from '@/utils/videoTelemetry';

// Network connection type hints
type EffectiveConnectionType = '4g' | '3g' | '2g' | 'slow-2g';

interface NetworkInfo {
  effectiveType?: EffectiveConnectionType;
  saveData?: boolean;
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
}

interface BatteryStatus {
  level: number; // 0-1
  charging: boolean;
}

interface AdaptivePrefetchConfig {
  /** Number of items to prefetch ahead */
  prefetchAhead: number;
  /** Number of items to prefetch behind (for scroll-back) */
  prefetchBehind: number;
  /** Total HLS instances to keep in pool */
  poolSize: number;
  /** Buffer length for HLS.js (seconds) */
  hlsBufferLength: number;
  /** Quality cap (0 = auto, otherwise height in px) */
  qualityCap: number;
  /** Whether to preload thumbnails */
  preloadThumbnails: boolean;
  /** Whether to preload HLS manifests */
  preloadManifests: boolean;
  /** Reason for current config (for debugging) */
  reason: string;
}

// Presets for different network conditions
const PREFETCH_PRESETS: Record<string, AdaptivePrefetchConfig> = {
  // Excellent connection - aggressive prefetch
  excellent: {
    prefetchAhead: 12,
    prefetchBehind: 4,
    poolSize: 16,
    hlsBufferLength: 15,
    qualityCap: 0, // Auto (highest)
    preloadThumbnails: true,
    preloadManifests: true,
    reason: 'excellent_connection',
  },
  // Good 4G connection
  good: {
    prefetchAhead: 8,
    prefetchBehind: 3,
    poolSize: 12,
    hlsBufferLength: 10,
    qualityCap: 0,
    preloadThumbnails: true,
    preloadManifests: true,
    reason: '4g_connection',
  },
  // Moderate 3G connection
  moderate: {
    prefetchAhead: 5,
    prefetchBehind: 2,
    poolSize: 8,
    hlsBufferLength: 6,
    qualityCap: 720,
    preloadThumbnails: true,
    preloadManifests: true,
    reason: '3g_connection',
  },
  // Poor 2G connection
  poor: {
    prefetchAhead: 2,
    prefetchBehind: 1,
    poolSize: 4,
    hlsBufferLength: 4,
    qualityCap: 480,
    preloadThumbnails: true,
    preloadManifests: false, // Save bandwidth
    reason: '2g_connection',
  },
  // Save data mode - minimal prefetch
  saveData: {
    prefetchAhead: 1,
    prefetchBehind: 0,
    poolSize: 2,
    hlsBufferLength: 3,
    qualityCap: 360,
    preloadThumbnails: false,
    preloadManifests: false,
    reason: 'save_data_mode',
  },
  // Low battery - conservative
  lowBattery: {
    prefetchAhead: 3,
    prefetchBehind: 1,
    poolSize: 6,
    hlsBufferLength: 5,
    qualityCap: 720,
    preloadThumbnails: true,
    preloadManifests: true,
    reason: 'low_battery',
  },
  // Fast scroller - aggressive prefetch
  fastScroller: {
    prefetchAhead: 15,
    prefetchBehind: 5,
    poolSize: 20,
    hlsBufferLength: 8,
    qualityCap: 0,
    preloadThumbnails: true,
    preloadManifests: true,
    reason: 'fast_scroll_detected',
  },
};

// Scroll velocity tracking
const SCROLL_VELOCITY_WINDOW = 1000; // 1 second
const FAST_SCROLL_THRESHOLD = 3; // 3+ items per second = fast scroller

export function useAdaptivePrefetch() {
  const [config, setConfig] = useState<AdaptivePrefetchConfig>(PREFETCH_PRESETS.good);
  
  // Scroll velocity tracking
  const scrollEventsRef = useRef<number[]>([]);
  const lastConfigUpdateRef = useRef<number>(0);
  
  // Get network info
  const getNetworkInfo = useCallback((): NetworkInfo => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (!connection) return {};
    
    return {
      effectiveType: connection.effectiveType,
      saveData: connection.saveData,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }, []);
  
  // Get battery status
  const getBatteryStatus = useCallback(async (): Promise<BatteryStatus | null> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
        };
      }
    } catch {
      // Battery API not available
    }
    return null;
  }, []);
  
  // Calculate scroll velocity (items per second)
  const getScrollVelocity = useCallback((): number => {
    const now = Date.now();
    const recentEvents = scrollEventsRef.current.filter(
      t => now - t < SCROLL_VELOCITY_WINDOW
    );
    scrollEventsRef.current = recentEvents;
    
    if (recentEvents.length < 2) return 0;
    
    const duration = (recentEvents[recentEvents.length - 1] - recentEvents[0]) / 1000;
    if (duration === 0) return 0;
    
    return recentEvents.length / duration;
  }, []);
  
  // Record a scroll event
  const recordScrollEvent = useCallback(() => {
    scrollEventsRef.current.push(Date.now());
    
    // Cleanup old events
    const now = Date.now();
    scrollEventsRef.current = scrollEventsRef.current.filter(
      t => now - t < SCROLL_VELOCITY_WINDOW * 2
    );
  }, []);
  
  // Determine optimal config based on current conditions
  const determineConfig = useCallback(async (): Promise<AdaptivePrefetchConfig> => {
    const network = getNetworkInfo();
    const battery = await getBatteryStatus();
    const scrollVelocity = getScrollVelocity();
    
    // Priority 1: Save data mode - user explicitly wants minimal data usage
    if (network.saveData) {
      return PREFETCH_PRESETS.saveData;
    }
    
    // Priority 2: Low battery (< 20% and not charging)
    if (battery && battery.level < 0.2 && !battery.charging) {
      return PREFETCH_PRESETS.lowBattery;
    }
    
    // Priority 3: Fast scroller - they need more prefetch
    if (scrollVelocity >= FAST_SCROLL_THRESHOLD) {
      return PREFETCH_PRESETS.fastScroller;
    }
    
    // Priority 4: Network-based selection
    const effectiveType = network.effectiveType || '4g';
    const downlink = network.downlink || 10;
    
    // Excellent connection: 4G with good downlink
    if (effectiveType === '4g' && downlink >= 10) {
      return PREFETCH_PRESETS.excellent;
    }
    
    // Good connection: 4G
    if (effectiveType === '4g') {
      return PREFETCH_PRESETS.good;
    }
    
    // Moderate: 3G
    if (effectiveType === '3g') {
      return PREFETCH_PRESETS.moderate;
    }
    
    // Poor: 2G or slow-2g
    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      return PREFETCH_PRESETS.poor;
    }
    
    return PREFETCH_PRESETS.good;
  }, [getNetworkInfo, getBatteryStatus, getScrollVelocity]);
  
  // Update config when conditions change
  const updateConfig = useCallback(async () => {
    const now = Date.now();
    // Throttle updates to max once per second
    if (now - lastConfigUpdateRef.current < 1000) return;
    lastConfigUpdateRef.current = now;
    
    const newConfig = await determineConfig();
    
    setConfig(prev => {
      if (prev.reason !== newConfig.reason) {
        logVideoTelemetry('adaptive_prefetch_changed', {
          from: prev.reason,
          to: newConfig.reason,
          prefetchAhead: newConfig.prefetchAhead,
        });
        return newConfig;
      }
      return prev;
    });
  }, [determineConfig]);
  
  // Listen for network changes
  useEffect(() => {
    const connection = (navigator as any).connection;
    
    if (connection) {
      const handleChange = () => updateConfig();
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, [updateConfig]);
  
  // Initial config
  useEffect(() => {
    updateConfig();
  }, [updateConfig]);
  
  // Called when user scrolls to a new item
  const onIndexChange = useCallback(() => {
    recordScrollEvent();
    updateConfig();
  }, [recordScrollEvent, updateConfig]);
  
  return {
    config,
    onIndexChange,
    recordScrollEvent,
    updateConfig,
    getNetworkInfo,
  };
}

// Export presets for testing/debugging
export { PREFETCH_PRESETS };
export type { AdaptivePrefetchConfig, NetworkInfo };
