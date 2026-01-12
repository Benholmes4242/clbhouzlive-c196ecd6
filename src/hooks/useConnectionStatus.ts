/**
 * Hook to track network connection status
 * Provides real-time updates when connection is lost/restored
 */

import { useState, useEffect, useCallback } from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
    lastOfflineAt: null
  });

  const handleOnline = useCallback(() => {
    console.log('[Connection] Network restored');
    setStatus(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: true,
      lastOnlineAt: Date.now()
    }));
  }, []);

  const handleOffline = useCallback(() => {
    console.log('[Connection] Network lost');
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      lastOfflineAt: Date.now()
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Clear the wasOffline flag after a delay
  const clearWasOffline = useCallback(() => {
    setStatus(prev => ({ ...prev, wasOffline: false }));
  }, []);

  return {
    ...status,
    clearWasOffline
  };
}
