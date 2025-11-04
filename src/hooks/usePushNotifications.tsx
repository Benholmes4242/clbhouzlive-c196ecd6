import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
}

export const usePushNotifications = () => {
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    isSubscribed: false,
    isLoading: false,
  });

  useEffect(() => {
    checkSupport();
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSupport = () => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    const permission = isSupported ? Notification.permission : null;
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission,
    }));
  };

  const checkSubscriptionStatus = async () => {
    if (!user || !state.isSupported) return;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      const preferences = data?.notification_preferences as any;
      const isSubscribed = preferences?.push_enabled || false;
      setState(prev => ({ ...prev, isSubscribed }));
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await registerServiceWorker();
        await updateSubscriptionStatus(true);
        
        toast({
          title: "Success",
          description: "Push notifications enabled successfully",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notification permission was denied",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications",
        variant: "destructive",
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const registerServiceWorker = async () => {
    // Service worker disabled - no sw.js file exists
    // If push notifications are needed, implement a proper service worker with cache versioning
    console.log('[Push] Service worker registration disabled - no sw.js file');
    return;
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
      toast({
        title: "Unsubscribed",
        description: "Push notifications have been disabled",
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive",
      });
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