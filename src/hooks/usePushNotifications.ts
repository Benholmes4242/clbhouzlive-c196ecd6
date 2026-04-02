import { useState, useCallback, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type PushState = 'unknown' | 'unavailable' | 'enabled' | 'disabled' | 'denied';

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

  const getOS = () => (window as any).median?.onesignal;

  // Login user to OneSignal with their Supabase UUID as external ID
  // This is the SDK v5 way — links the device to the user
  const loginToOneSignal = useCallback((userId: string) => {
    const os = getOS();
    if (!os?.login) return;
    try {
      os.login(userId);
      console.log('[Push] OneSignal login called with:', userId);
    } catch (e) {
      console.error('[Push] OneSignal login error:', e);
    }
  }, []);

  // Register device in our DB using the user's UUID as provider_id
  const registerDevice = useCallback(async (userId: string, enabled: boolean) => {
    try {
      const platform = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) 
        ? 'ios' : 'android';
      await supabase.functions.invoke('register-push-device', {
        body: { provider_id: userId, platform, enabled },
      });
    } catch (e) {
      console.error('[Push] Register device error:', e);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const os = getOS();

    if (!os) {
      setState('unavailable');
      setIsLoading(false);
      return;
    }

    // In SDK v5, check if user is opted in via the register status
    // We use our DB as source of truth for enabled/disabled
    if (user) {
      try {
        const { data } = await supabase
          .from('user_push_devices')
          .select('enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setState(data.enabled ? 'enabled' : 'disabled');
        } else {
          // No record yet — login to OneSignal and register
          loginToOneSignal(user.id);
          await registerDevice(user.id, true);
          setState('enabled');
        }
      } catch {
        setState('unknown');
      }
    }
    setIsLoading(false);
  }, [user, loginToOneSignal, registerDevice]);

  const enable = useCallback(async (): Promise<boolean> => {
    const os = getOS();
    if (!os) {
      toast.error('Push notifications not available on this device');
      return false;
    }
    if (!user) return false;
    setIsRegistering(true);
    try {
      // SDK v5: login + register prompt
      loginToOneSignal(user.id);
      os.register?.();
      await registerDevice(user.id, true);
      setState('enabled');
      toast.success('Push notifications enabled');
      return true;
    } catch {
      toast.error('Failed to enable push notifications');
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [user, loginToOneSignal, registerDevice]);

  const disable = useCallback(async (): Promise<boolean> => {
    const os = getOS();
    if (!user) return false;
    setIsRegistering(true);
    try {
      os?.logout?.();
      await registerDevice(user.id, false);
      setState('disabled');
      return true;
    } catch {
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [user, registerDevice]);

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
