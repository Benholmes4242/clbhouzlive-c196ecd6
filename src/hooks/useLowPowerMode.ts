/**
 * useLowPowerMode - Detect low battery/power states
 * 
 * Helps adapt video playback behavior when device is low on power.
 * Can be used to reduce quality or show a warning banner.
 */

import { useState, useEffect } from 'react';

interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export interface LowPowerState {
  /** Whether the device is in a low power state */
  isLowPowerMode: boolean;
  /** Current battery level (0-1) or null if unknown */
  batteryLevel: number | null;
  /** Whether the device is charging */
  isCharging: boolean | null;
}

/**
 * Hook to detect low power mode
 * 
 * Considers low power if:
 * - Battery level is below 20% AND not charging
 * 
 * Note: Battery API is not available on all browsers (notably iOS Safari)
 */
export function useLowPowerMode(): LowPowerState {
  const [state, setState] = useState<LowPowerState>({
    isLowPowerMode: false,
    batteryLevel: null,
    isCharging: null,
  });
  
  useEffect(() => {
    let mounted = true;
    let battery: BatteryManager | null = null;
    
    const checkLowPower = () => {
      if (!battery || !mounted) return;
      
      const isLow = battery.level < 0.2 && !battery.charging;
      
      setState({
        isLowPowerMode: isLow,
        batteryLevel: battery.level,
        isCharging: battery.charging,
      });
    };
    
    // Check if Battery API is available
    if ('getBattery' in navigator && navigator.getBattery) {
      navigator.getBattery()
        .then((batteryManager) => {
          if (!mounted) return;
          
          battery = batteryManager;
          checkLowPower();
          
          // Listen for battery changes
          battery.addEventListener('levelchange', checkLowPower);
          battery.addEventListener('chargingchange', checkLowPower);
        })
        .catch((error) => {
          // Battery API not available or permission denied
          console.log('[useLowPowerMode] Battery API not available:', error.message);
        });
    }
    
    return () => {
      mounted = false;
      if (battery) {
        battery.removeEventListener('levelchange', checkLowPower);
        battery.removeEventListener('chargingchange', checkLowPower);
      }
    };
  }, []);
  
  return state;
}

/**
 * Get recommended video settings for low power mode
 */
export function getLowPowerVideoSettings(isLowPower: boolean) {
  if (!isLowPower) {
    return {
      maxQualityLevel: -1, // No restriction
      shouldAutoplay: true,
      preloadStrategy: 'metadata' as const,
    };
  }
  
  return {
    maxQualityLevel: 1, // Cap at 360p
    shouldAutoplay: false, // Don't autoplay to save power
    preloadStrategy: 'none' as const,
  };
}
