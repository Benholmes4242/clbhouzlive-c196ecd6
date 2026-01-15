import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface NotificationPreferences {
  new_followers: boolean;
  likes: boolean;
  comments: boolean;
  shares: boolean;
  tags: boolean;
  course_activity: boolean;
  golf_news: boolean;
}

const defaultPrefs: NotificationPreferences = {
  new_followers: true,
  likes: true,
  comments: true,
  shares: true,
  tags: true,
  course_activity: true,
  golf_news: false,
};

const PREF_LABELS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'new_followers', label: 'New followers' },
  { key: 'likes', label: 'Likes on your posts' },
  { key: 'comments', label: 'Comments on your posts' },
  { key: 'shares', label: 'Shares' },
  { key: 'tags', label: 'Tags' },
  { key: 'course_activity', label: 'Course activity' },
  { key: 'golf_news', label: 'Golf news & events' },
];

export function NotificationsSheet({ open, onOpenChange, userId }: NotificationsSheetProps) {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Load preferences on open
  useEffect(() => {
    if (!open || !userId) return;

    const loadPrefs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('notification_preferences')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (data?.notification_preferences && typeof data.notification_preferences === 'object' && !Array.isArray(data.notification_preferences)) {
          const savedPrefs = data.notification_preferences as Record<string, boolean>;
          setPrefs({ 
            new_followers: savedPrefs.new_followers ?? defaultPrefs.new_followers,
            likes: savedPrefs.likes ?? defaultPrefs.likes,
            comments: savedPrefs.comments ?? defaultPrefs.comments,
            shares: savedPrefs.shares ?? defaultPrefs.shares,
            tags: savedPrefs.tags ?? defaultPrefs.tags,
            course_activity: savedPrefs.course_activity ?? defaultPrefs.course_activity,
            golf_news: savedPrefs.golf_news ?? defaultPrefs.golf_news,
          });
        }
      } catch (err) {
        console.error('[NotificationsSheet] load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, [open, userId]);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    setUpdating(key);
    
    // Optimistic update
    const prevPrefs = { ...prefs };
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: newPrefs })
        .eq('id', userId);

      if (error) throw error;

      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    } catch (err) {
      console.error('[NotificationsSheet] update error:', err);
      // Rollback
      setPrefs(prevPrefs);
      toast.error('Failed to update preference');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl px-4 pb-8 bg-white max-w-full h-[90svh]"
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 rounded-full bg-[#e2e8f0] mx-auto" />
        </div>

        <SheetHeader className="pb-2">
          <SheetTitle className="text-center text-[#1e293b] text-lg font-semibold">
            In-app notifications
          </SheetTitle>
          <p className="text-center text-[12px] text-[#94a3b8]">
            Preferences are saved. Push notifications are coming later.
          </p>
        </SheetHeader>

        <div className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#64748b]" />
            </div>
          ) : (
            <div className="space-y-1">
              {PREF_LABELS.map(({ key, label }) => (
                <div 
                  key={key}
                  className="flex items-center justify-between py-3 px-1"
                >
                  <span className="text-[15px] text-[#1e293b]">{label}</span>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(value) => handleToggle(key, value)}
                    disabled={updating === key}
                    className="data-[state=checked]:bg-[#1e293b] data-[state=unchecked]:bg-[#e2e8f0]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
