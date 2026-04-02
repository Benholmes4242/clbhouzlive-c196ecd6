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

const getOneSignal = (): OneSignalSDK | undefined => {
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

export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useSupabaseSession();
  const [state, setState] = useState<PushState>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const detectPlatform = useCallback((): string => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'web';
  }, []);

  const isOneSignalAvailable = useCallback((): boolean => {
    return !!(getOneSignal() || window.median?.onesignal);
  }, []);

  const getOneSignalInfo = useCallback((): Promise<{ id: string | null; subscribed: boolean; permissionDenied: boolean }> => {
    return new Promise((resolve) => {
      if (window.median?.onesignal) {
        window.median.onesignal.onesignalInfo((info: {
          oneSignalUserId?: string;
          oneSignalSubscribed?: boolean;
          oneSignalPushPermissionStatus?: string;
        }) => {
          const permissionDenied = info.oneSignalPushPermissionStatus === 'denied';
          resolve({
            id: info.oneSignalUserId || null,
            subscribed: info.oneSignalSubscribed || false,
            permissionDenied,
          });
        });
        return;
      }

      const oneSignal = getOneSignal();
      if (oneSignal) {
        oneSignal.push(() => {
          oneSignal.getUserId((userId) => {
            oneSignal.isPushNotificationsEnabled((enabled) => {
              resolve({ id: userId, subscribed: enabled, permissionDenied: false });
            });
          });
        });
        return;
      }

      resolve({ id: null, subscribed: false, permissionDenied: false });
    });
  }, []);

  const pollForSubscription = useCallback(async (maxWaitMs: number = 25000, intervalMs: number = 1000): Promise<{ id: string | null; subscribed: boolean; permissionDenied: boolean }> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const info = await getOneSignalInfo();
      if (info.id && info.subscribed) return info;
      if (info.permissionDenied) return info;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return await getOneSignalInfo();
  }, [getOneSignalInfo]);

  const registerDevice = useCallback(async (providerId: string, enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    const platform = detectPlatform();
    try {
      const { error } = await supabase.functions.invoke('register-push-device', {
        body: { provider_id: providerId, platform, enabled },
      });
      if (error) return false;
      return true;
    } catch {
      return false;
    }
  }, [user, detectPlatform]);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    if (!isOneSignalAvailable()) {
      setState('unavailable');
      setIsLoading(false);
      return;
    }

    try {
      const { id, subscribed, permissionDenied } = await getOneSignalInfo();

      if (permissionDenied) {
        setState('denied');
      } else if (!id) {
        setState('prompt');
      } else if (subscribed) {
        // Auto-register device if subscribed but user hasn't tapped toggle
        if (user && id) {
          registerDevice(id, true);
        }
        setState('enabled');
      } else {
        setState('disabled');
      }
    } catch {
      setState('unknown');
    } finally {
      setIsLoading(false);
    }
  }, [isOneSignalAvailable, getOneSignalInfo, registerDevice, user]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!isOneSignalAvailable()) {
      toast.error('Push notifications not available on this device');
      return false;
    }
    setIsRegistering(true);
    try {
      if (window.median?.onesignal) {
        window.median.onesignal.register();
      } else {
        const oneSignal = getOneSignal();
        if (oneSignal) {
          oneSignal.push(() => oneSignal.registerForPushNotifications());
        }
      }
      const { id, subscribed, permissionDenied } = await pollForSubscription(25000, 1000);
      if (permissionDenied) { setState('denied'); return false; }
      if (!id) { setState('prompt'); return false; }
      if (subscribed) {
        if (user) await registerDevice(id, true);
        setState('enabled');
        return true;
      }
      setState('disabled');
      return false;
    } catch {
      toast.error('Failed to enable push notifications');
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isOneSignalAvailable, pollForSubscription, registerDevice, user]);

  const disable = useCallback(async (): Promise<boolean> => {
    if (!isOneSignalAvailable()) return false;
    setIsRegistering(true);
    try {
      if (window.median?.onesignal?.setSubscription) {
        window.median.onesignal.setSubscription(false);
      } else {
        const oneSignal = getOneSignal();
        if (oneSignal) oneSignal.push(() => oneSignal.setSubscription(false));
      }
      const { id } = await getOneSignalInfo();
      if (id && user) await registerDevice(id, false);
      setState('disabled');
      return true;
    } catch {
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isOneSignalAvailable, getOneSignalInfo, registerDevice, user]);

  // Initial check + re-check on app focus
  useEffect(() => {
    refresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refresh]);

  return { state, isLoading, isRegistering, enable, disable, refresh };
}
