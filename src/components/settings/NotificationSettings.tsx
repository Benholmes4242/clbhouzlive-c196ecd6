import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Smartphone } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  new_follower: boolean;
  post_likes: boolean;
  post_comments: boolean;
  post_shares: boolean;
  tagged_in_post: boolean;
  course_activity: boolean;
  golf_news: boolean;
  push_enabled: boolean;
}

const NotificationSettings = () => {
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const pushNotifications = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_follower: true,
    post_likes: true,
    post_comments: true,
    post_shares: true,
    tagged_in_post: true,
    course_activity: false,
    golf_news: false,
    push_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences as unknown as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: newPreferences as any })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferences(newPreferences);
  };

  const requestPushPermission = async () => {
    const success = await pushNotifications.requestPermission();
    if (success) {
      handlePreferenceChange('push_enabled', true);
    }
  };

  const notificationTypes = [
    {
      key: 'new_follower' as keyof NotificationPreferences,
      label: 'New Followers',
      description: 'When someone follows you',
      icon: '👥',
    },
    {
      key: 'post_likes' as keyof NotificationPreferences,
      label: 'Likes on my posts',
      description: 'When someone likes your posts',
      icon: '❤️',
    },
    {
      key: 'post_comments' as keyof NotificationPreferences,
      label: 'Comments on my posts',
      description: 'When someone comments on your posts',
      icon: '💬',
    },
    {
      key: 'post_shares' as keyof NotificationPreferences,
      label: 'Post shares',
      description: 'When someone shares your posts',
      icon: '📤',
    },
    {
      key: 'tagged_in_post' as keyof NotificationPreferences,
      label: 'Tagged in posts',
      description: 'When you\'re tagged in someone\'s post',
      icon: '🏷️',
    },
    {
      key: 'course_activity' as keyof NotificationPreferences,
      label: 'Course activity updates',
      description: 'New posts and reviews at courses you follow',
      icon: '📍',
      optIn: true,
    },
    {
      key: 'golf_news' as keyof NotificationPreferences,
      label: 'Golf news & events',
      description: 'Major tournament updates and golf news',
      icon: '📰',
      optIn: true,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enable push notifications to receive alerts even when the app is closed.
            </p>
            
            {!pushNotifications.isSupported && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Push notifications are not supported in this browser.
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notifications on your device
                </p>
              </div>
              <Switch
                id="push-enabled"
                checked={preferences.push_enabled && pushNotifications.isSupported}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestPushPermission();
                  } else {
                    pushNotifications.unsubscribe();
                    handlePreferenceChange('push_enabled', false);
                  }
                }}
                disabled={isSaving || pushNotifications.isLoading || !pushNotifications.isSupported}
              />
            </div>
            
            {pushNotifications.isSupported && pushNotifications.permission === 'granted' && preferences.push_enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={pushNotifications.showTestNotification}
                className="w-full"
              >
                Send Test Notification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg">{type.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={type.key} className="font-medium">
                        {type.label}
                      </Label>
                      {type.optIn && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          Opt-in
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={preferences[type.key]}
                  onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                  disabled={isSaving}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;