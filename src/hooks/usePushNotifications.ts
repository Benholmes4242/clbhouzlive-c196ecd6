import { useState, useCallback, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PushState = 'unavailable' | 'enabled' | 'disabled' | 'unknown';

interface UsePushNotificationsResult {
  state: PushState;
  isLoading: boolean;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useSupabaseSession();
  const [state, setState] = useState<PushState>('unknown');
  const [isLoading, setIsLoading] = useState(true);

  const getOS = () => (window as any).median?.onesignal;

  useEffect(() => {
    if (!user) return;
    const os = getOS();
    if (!os) { setState('unavailable'); setIsLoading(false); return; }

    supabase
      .from('user_push_devices')
      .select('enabled')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setState(data ? (data.enabled ? 'enabled' : 'disabled') : 'enabled');
        setIsLoading(false);
      })
      .catch(() => { setState('unknown'); setIsLoading(false); });
  }, [user]);

  const enable = useCallback(async (): Promise<boolean> => {
    const os = getOS();
    if (!os || !user) { toast.error('Push notifications not available'); return false; }
    try {
      os.userPrivacyConsent?.(true);
      os.login?.(user.id);
      os.register?.();
      const platform = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ? 'ios' : 'android';
      const { error } = await supabase.functions.invoke('register-push-device', {
        body: { platform, enabled: true },
      });
      if (error) throw error;
      setState('enabled');
      toast.success('Push notifications enabled');
      return true;
    } catch {
      toast.error('Failed to enable push notifications');
      return false;
    }
  }, [user]);

  const disable = useCallback(async (): Promise<boolean> => {
    const os = getOS();
    if (!user) return false;
    try {
      os?.logout?.();
      const platform = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ? 'ios' : 'android';
      await supabase.functions.invoke('register-push-device', {
        body: { platform, enabled: false },
      });
      setState('disabled');
      return true;
    } catch {
      return false;
    }
  }, [user]);

  return { state, isLoading, enable, disable };
}
