import { useEffect, useRef, useCallback } from 'react';
import { useKeepAlive } from '@/components/keep-alive/KeepAliveOutlet';
import { videoDebug } from '@/config/videoDebug';

interface UseKeepAliveActivationOptions {
  /**
   * Called when this keep-alive route becomes active (tab switched back to us)
   * Use this to resume video playback or refetch stale data
   */
  onActivate?: () => void;
  
  /**
   * Called when this keep-alive route becomes inactive (tab switched away)
   * Videos are auto-paused by KeepAliveOutlet, but you can do additional cleanup here
   */
  onDeactivate?: () => void;
}

/**
 * useKeepAliveActivation - Respond to keep-alive activation state changes
 * 
 * This hook allows components within a keep-alive route to react when the route
 * becomes active or inactive due to tab navigation.
 * 
 * Usage in Clubhouse.tsx:
 * ```tsx
 * const { isActive } = useKeepAliveActivation({
 *   onActivate: () => {
 *     // Resume video playback when tab becomes active
 *     console.log('[Clubhouse] Tab activated - resuming video');
 *   },
 *   onDeactivate: () => {
 *     // HLS instances suspended, can do additional cleanup
 *     console.log('[Clubhouse] Tab deactivated - videos paused');
 *   }
 * });
 * ```
 */
export function useKeepAliveActivation({ 
  onActivate, 
  onDeactivate 
}: UseKeepAliveActivationOptions = {}) {
  const { isActive, path } = useKeepAlive();
  const prevActiveRef = useRef(isActive);
  
  // Stable callback refs to avoid effect dependencies
  const onActivateRef = useRef(onActivate);
  const onDeactivateRef = useRef(onDeactivate);
  
  useEffect(() => {
    onActivateRef.current = onActivate;
    onDeactivateRef.current = onDeactivate;
  }, [onActivate, onDeactivate]);

  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
      // Just became active (tab switched back to us)
      videoDebug('keepAlive', 'Route activated', { path });
      onActivateRef.current?.();
    } else if (!isActive && prevActiveRef.current) {
      // Just became inactive (tab switched away)
      videoDebug('keepAlive', 'Route deactivated', { path });
      onDeactivateRef.current?.();
    }
    prevActiveRef.current = isActive;
  }, [isActive, path]);

  return { isActive, path };
}

export default useKeepAliveActivation;
