import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

// Type for OneSignal SDK (injected by Median)
interface OneSignalSDK {
  push: (callback: () => void) => void;
  registerForPushNotifications: () => void;
  getUserId: (callback: (userId: string | null) => void) => void;
  isPushNotificationsEnabled: (callback: (enabled: boolean) => void) => void;
  setSubscription: (enabled: boolean) => void;
}

// Access OneSignal from window (avoiding global declaration conflicts)
const getOneSignal = (): OneSignalSDK | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).OneSignal;
};

type PushState = 'unknown' | 'unavailable' | 'prompt' | 'denied' | 'enabled' | 'disabled';

interface UsePushNotificationsResult {
  state: PushState;
  isLoading: boolean;
  isRegistering: boolean;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
  refresh: () => void;
}

/**
 * Hook to manage push notification state with OneSignal via Median
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useSupabaseSession();
  const [state, setState] = useState<PushState>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // Detect platform (ios/android/web)
  const detectPlatform = useCallback((): string => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'web';
  }, []);

  // Check if OneSignal is available (Median injects it)
  const isOneSignalAvailable = useCallback((): boolean => {
    return !!(getOneSignal() || window.median?.onesignal);
  }, []);

  // Get OneSignal subscription info
  const getOneSignalInfo = useCallback((): Promise<{ id: string | null; subscribed: boolean; permissionDenied: boolean }> => {
    return new Promise((resolve) => {
      // Try Median's onesignal bridge first
      if (window.median?.onesignal) {
        window.median.onesignal.onesignalInfo((info: { 
          oneSignalUserId?: string; 
          oneSignalSubscribed?: boolean;
          oneSignalRequiresUserPrivacyConsent?: boolean;
          oneSignalPushPermissionStatus?: string; // 'authorized' | 'denied' | 'not_determined' etc.
        }) => {
          console.log('[usePushNotifications] Median onesignal info:', info);
          const permissionDenied = info.oneSignalPushPermissionStatus === 'denied';
          resolve({
            id: info.oneSignalUserId || null,
            subscribed: info.oneSignalSubscribed || false,
            permissionDenied,
          });
        });
        return;
      }

      // Fallback to standard OneSignal SDK
      const oneSignal = getOneSignal();
      if (oneSignal) {
        oneSignal.push(() => {
          oneSignal.getUserId((userId) => {
            oneSignal.isPushNotificationsEnabled((enabled) => {
              console.log('[usePushNotifications] OneSignal info:', { userId, enabled });
              // Standard SDK doesn't easily expose permission denied status
              resolve({ id: userId, subscribed: enabled, permissionDenied: false });
            });
          });
        });
        return;
      }

      resolve({ id: null, subscribed: false, permissionDenied: false });
    });
  }, []);

  // Poll for OneSignal subscription with timeout
  const pollForSubscription = useCallback(async (maxWaitMs: number = 25000, intervalMs: number = 1000): Promise<{ id: string | null; subscribed: boolean; permissionDenied: boolean }> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const info = await getOneSignalInfo();
      console.log('[usePushNotifications] Polling:', info);
      
      // Exit early if we got a subscription ID and it's subscribed
      if (info.id && info.subscribed) {
        return info;
      }
      
      // Exit early if permission was explicitly denied
      if (info.permissionDenied) {
        return info;
      }
      
      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    
    // Final check after timeout
    return await getOneSignalInfo();
  }, [getOneSignalInfo]);

  // Register the device with our backend
  const registerDevice = useCallback(async (providerId: string, enabled: boolean): Promise<boolean> => {
    if (!user) {
      console.error('[usePushNotifications] No user for device registration');
      return false;
    }

    const platform = detectPlatform();
    console.log('[usePushNotifications] Registering device:', { providerId, platform, enabled });

    try {
      const { data, error } = await supabase.functions.invoke('register-push-device', {
        body: {
          provider_id: providerId,
          platform,
          enabled,
        },
      });

      if (error) {
        console.error('[usePushNotifications] Registration error:', error);
        return false;
      }

      console.log('[usePushNotifications] Registration success:', data);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Registration failed:', err);
      return false;
    }
  }, [user, detectPlatform]);

  // Refresh current state
  const refresh = useCallback(async () => {
    setIsLoading(true);

    if (!isOneSignalAvailable()) {
      console.log('[usePushNotifications] OneSignal not available');
      setState('unavailable');
      setIsLoading(false);
      return;
    }

    try {
      const { id, subscribed, permissionDenied } = await getOneSignalInfo();
      console.log('[usePushNotifications] Current state:', { id, subscribed, permissionDenied });

      if (permissionDenied) {
        setState('denied');
      } else if (!id) {
        setState('prompt'); // Not yet prompted or unknown
      } else if (subscribed) {
        setState('enabled');
      } else {
        setState('disabled');
      }
    } catch (err) {
      console.error('[usePushNotifications] Error checking state:', err);
      setState('unknown');
    } finally {
      setIsLoading(false);
    }
  }, [isOneSignalAvailable, getOneSignalInfo]);

  // Enable push notifications
  const enable = useCallback(async (): Promise<boolean> => {
    if (!isOneSignalAvailable()) {
      toast.error('Push notifications not available on this device');
      return false;
    }

    setIsRegistering(true);

    try {
      // Trigger the permission prompt
      console.log('[usePushNotifications] Triggering registration...');
      
      if (window.median?.onesignal) {
        window.median.onesignal.register();
      } else {
        const oneSignal = getOneSignal();
        if (oneSignal) {
          oneSignal.push(() => {
            oneSignal.registerForPushNotifications();
          });
        }
      }

      // Poll for subscription (up to 25 seconds for user to respond to prompt)
      const { id, subscribed, permissionDenied } = await pollForSubscription(25000, 1000);
      console.log('[usePushNotifications] After polling:', { id, subscribed, permissionDenied });

      if (permissionDenied) {
        console.log('[usePushNotifications] Permission explicitly denied by user');
        setState('denied');
        return false;
      }

      if (!id) {
        // No ID after 25s - permission still unknown/pending, keep as prompt
        console.log('[usePushNotifications] No subscription ID after polling - staying in prompt state');
        setState('prompt');
        return false;
      }

      if (subscribed) {
        // Register with backend (Phase C)
        if (user) {
          const registered = await registerDevice(id, true);
          if (!registered) {
            toast.error("Couldn't save push settings. Try again.");
          }
        }
        setState('enabled');
        return true;
      }

      setState('disabled');
      return false;
    } catch (err) {
      console.error('[usePushNotifications] Enable error:', err);
      toast.error('Failed to enable push notifications');
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isOneSignalAvailable, pollForSubscription, registerDevice, user]);

  // Disable push notifications
  const disable = useCallback(async (): Promise<boolean> => {
    if (!isOneSignalAvailable()) {
      return false;
    }

    setIsRegistering(true);

    try {
      // Try Median's opt-out method first
      let optedOutViaMedian = false;
      if (window.median?.onesignal?.setSubscription) {
        console.log('[usePushNotifications] Using Median bridge to disable subscription');
        window.median.onesignal.setSubscription(false);
        optedOutViaMedian = true;
      } else {
        // Fallback to standard OneSignal SDK
        const oneSignal = getOneSignal();
        if (oneSignal) {
          console.log('[usePushNotifications] Using OneSignal SDK to disable subscription');
          oneSignal.push(() => {
            oneSignal.setSubscription(false);
          });
        } else {
          // No client-side opt-out available - just update DB
          console.log('[usePushNotifications] No opt-out method available - only updating DB');
        }
      }

      // Get current subscription ID to update backend
      const { id } = await getOneSignalInfo();
      
      if (id && user) {
        const registered = await registerDevice(id, false);
        if (!registered) {
          console.warn('[usePushNotifications] Failed to update DB - but local state changed');
        }
      }

      setState('disabled');
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Disable error:', err);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isOneSignalAvailable, getOneSignalInfo, registerDevice, user]);

  // Initial check
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    state,
    isLoading,
    isRegistering,
    enable,
    disable,
    refresh,
  };
}
