import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
}

export const usePushNotifications = () => {
  const { user } = useSupabaseSession();
  
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    isSubscribed: false,
    isLoading: false,
  });

  const refresh = useCallback(async () => {
    // Re-check browser support & permission
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    const permission = isSupported ? Notification.permission : null;

    setState(prev => ({ ...prev, isSupported, permission }));

    if (!user || !isSupported) return;

    // If browser permission is granted, auto-register in our DB
    if (permission === 'granted') {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        const preferences = (data?.notification_preferences as any) || {};
        const alreadyEnabled = preferences?.push_enabled || false;

        if (!alreadyEnabled) {
          // Auto-register: permission granted but not yet stored
          const updatedPreferences = { ...preferences, push_enabled: true };
          await supabase
            .from('user_profiles')
            .update({ notification_preferences: updatedPreferences })
            .eq('id', user.id);
          setState(prev => ({ ...prev, isSubscribed: true }));
        } else {
          setState(prev => ({ ...prev, isSubscribed: true }));
        }
      } catch (error) {
        console.error('Error during refresh auto-register:', error);
      }
    } else {
      // Permission not granted — check DB status
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        const preferences = (data?.notification_preferences as any) || {};
        const isSubscribed = preferences?.push_enabled || false;
        setState(prev => ({ ...prev, isSubscribed }));
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    }
  }, [user]);

  // Initial check + visibilitychange listener
  useEffect(() => {
    refresh();

    // Re-check when app comes back into focus
    // (catches case where iOS granted permission via OS prompt)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refresh]);

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast.error("Not Supported", { description: "Push notifications are not supported in this browser" });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await updateSubscriptionStatus(true);
        toast.success("Notifications enabled");
        return true;
      } else {
        toast.error("Permission Denied", { description: "Push notification permission was denied" });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error("Couldn't enable notifications");
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateSubscriptionStatus = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      const currentPreferences = (currentProfile?.notification_preferences as any) || {};
      const updatedPreferences = {
        ...currentPreferences,
        push_enabled: enabled,
      };

      await supabase
        .from('user_profiles')
        .update({ notification_preferences: updatedPreferences })
        .eq('id', user.id);

      setState(prev => ({ ...prev, isSubscribed: enabled }));
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await updateSubscriptionStatus(false);
      toast.success("Unsubscribed", { description: "Push notifications have been disabled" });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error("Couldn't disable notifications");
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const showTestNotification = () => {
    if (state.permission === 'granted') {
      new Notification('Clbhouz Test', {
        body: 'Push notifications are working!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  };

  return {
    ...state,
    requestPermission,
    unsubscribe,
    showTestNotification,
  };
};

  return {
    ...state,
    requestPermission,
    unsubscribe,
    showTestNotification,
  };
};