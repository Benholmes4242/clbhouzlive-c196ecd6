/**
 * Network Status Awareness
 * 
 * Provides hooks and utilities for:
 * - Detecting online/offline status
 * - Detecting connection type (4G, WiFi, etc.)
 * - Auto-pausing uploads when offline
 */

import { useState, useEffect, useCallback } from 'react';

interface NetworkState {
  isOnline: boolean;
  connectionType: string | null;
  effectiveType: string | null; // 4g, 3g, 2g, slow-2g
  downlink: number | null; // Mbps
  rtt: number | null; // Round-trip time in ms
}

/**
 * Hook to monitor network status
 */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>(() => getNetworkState());
  
  useEffect(() => {
    const handleOnline = () => {
      setState(getNetworkState());
    };
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };
    
    const handleConnectionChange = () => {
      setState(getNetworkState());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen to connection changes if available
    const connection = getNetworkConnection();
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);
  
  return state;
}

/**
 * Get current network state
 */
function getNetworkState(): NetworkState {
  const connection = getNetworkConnection();
  
  return {
    isOnline: navigator.onLine,
    connectionType: connection?.type || null,
    effectiveType: connection?.effectiveType || null,
    downlink: connection?.downlink || null,
    rtt: connection?.rtt || null,
  };
}

/**
 * Get Network Information API connection object
 */
function getNetworkConnection(): NetworkInformation | null {
  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

// Type for Network Information API
interface NetworkInformation extends EventTarget {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Hook to automatically pause/resume uploads based on network status
 */
export function useUploadNetworkAwareness(
  onOffline: () => void,
  onOnline: () => void
): { isOnline: boolean } {
  const { isOnline } = useNetworkStatus();
  
  useEffect(() => {
    if (!isOnline) {
      onOffline();
    } else {
      onOnline();
    }
  }, [isOnline, onOffline, onOnline]);
  
  return { isOnline };
}

/**
 * Check if connection is considered "slow"
 */
export function isSlowConnection(): boolean {
  const connection = getNetworkConnection();
  if (!connection) return false;
  
  const effectiveType = connection.effectiveType;
  return effectiveType === '2g' || effectiveType === 'slow-2g';
}

/**
 * Get recommended chunk size based on connection
 */
export function getRecommendedChunkSize(): number {
  const connection = getNetworkConnection();
  
  if (!connection) {
    return 50 * 1024 * 1024; // Default 50MB
  }
  
  switch (connection.effectiveType) {
    case 'slow-2g':
      return 5 * 1024 * 1024; // 5MB for very slow connections
    case '2g':
      return 10 * 1024 * 1024; // 10MB
    case '3g':
      return 25 * 1024 * 1024; // 25MB
    default:
      return 50 * 1024 * 1024; // 50MB for 4G/WiFi
  }
}

/**
 * Wait for network to come back online
 */
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
}
