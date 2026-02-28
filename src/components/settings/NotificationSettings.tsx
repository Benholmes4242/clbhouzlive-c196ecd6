import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Info } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationPreferences {
  new_follower: boolean;
  post_likes: boolean;
  post_comments: boolean;
  post_shares: boolean;
  tagged_in_post: boolean;
  course_activity: boolean;
  golf_news: boolean;
}

const NotificationSettings = () => {
  const { user } = useSupabaseSession();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_follower: true,
    post_likes: true,
    post_comments: true,
    post_shares: true,
    tagged_in_post: true,
    course_activity: false,
    golf_news: false,
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
        // Only pick the keys we care about (exclude push_enabled)
        const prefs = data.notification_preferences as any;
        setPreferences({
          new_follower: prefs.new_follower ?? true,
          post_likes: prefs.post_likes ?? true,
          post_comments: prefs.post_comments ?? true,
          post_shares: prefs.post_shares ?? true,
          tagged_in_post: prefs.tagged_in_post ?? true,
          course_activity: prefs.course_activity ?? false,
          golf_news: prefs.golf_news ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast.error("Error", { description: "Failed to load notification preferences" });
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

      toast.success("Success", { description: "Notification preferences updated" });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error("Error", { description: "Failed to update notification preferences" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferences(newPreferences);
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
            In-app Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          In-app Notifications
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-normal">
            Beta
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-6">
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              These preferences control in-app notifications. Push notifications are coming soon.
            </p>
          </div>
        </div>
        
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
  );
};

export default NotificationSettings;
