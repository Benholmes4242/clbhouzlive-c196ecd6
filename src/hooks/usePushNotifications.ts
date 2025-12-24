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
  const getOneSignalInfo = useCallback((): Promise<{ id: string | null; subscribed: boolean }> => {
    return new Promise((resolve) => {
      // Try Median's onesignal bridge first
      if (window.median?.onesignal) {
        window.median.onesignal.onesignalInfo((info: { oneSignalUserId?: string; oneSignalSubscribed?: boolean }) => {
          console.log('[usePushNotifications] Median onesignal info:', info);
          resolve({
            id: info.oneSignalUserId || null,
            subscribed: info.oneSignalSubscribed || false,
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
              resolve({ id: userId, subscribed: enabled });
            });
          });
        });
        return;
      }

      resolve({ id: null, subscribed: false });
    });
  }, []);

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
      const { id, subscribed } = await getOneSignalInfo();
      console.log('[usePushNotifications] Current state:', { id, subscribed });

      if (!id) {
        setState('prompt');
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

      // Wait a bit for the prompt to be handled
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get the result
      const { id, subscribed } = await getOneSignalInfo();
      console.log('[usePushNotifications] After registration:', { id, subscribed });

      if (!id) {
        console.log('[usePushNotifications] No subscription ID after prompt - user likely denied');
        setState('denied');
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
  }, [isOneSignalAvailable, getOneSignalInfo, registerDevice, user]);

  // Disable push notifications
  const disable = useCallback(async (): Promise<boolean> => {
    if (!isOneSignalAvailable()) {
      return false;
    }

    setIsRegistering(true);

    try {
      // Opt out in OneSignal if method exists
      const oneSignal = getOneSignal();
      if (oneSignal) {
        oneSignal.push(() => {
          oneSignal.setSubscription(false);
        });
      }

      // Get current subscription ID to update backend
      const { id } = await getOneSignalInfo();
      
      if (id && user) {
        await registerDevice(id, false);
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
