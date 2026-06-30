import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const INK_55 = '#64748B';

interface NotifPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  mentions: boolean;
  tour_updates: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  likes: true,
  comments: true,
  follows: true,
  messages: true,
  mentions: true,
  tour_updates: true,
};

const LABELS: Record<keyof NotifPrefs, string> = {
  likes: 'Likes',
  comments: 'Comments',
  follows: 'New followers',
  messages: 'Messages',
  mentions: 'Mentions',
  tour_updates: 'Tour updates',
};

export default function NotificationsPage() {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const pushNotifications = usePushNotifications();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [isSaving, setIsSaving] = useState(false);

  const isPushEnabled = 'isSubscribed' in pushNotifications
    ? (pushNotifications as any).isSubscribed
    : (pushNotifications as any).state === 'enabled';

  const handleTogglePush = () => {
    if ('requestPermission' in pushNotifications && 'unsubscribe' in pushNotifications) {
      if (isPushEnabled) (pushNotifications as any).unsubscribe();
      else (pushNotifications as any).requestPermission();
    } else if ('enable' in pushNotifications && 'disable' in pushNotifications) {
      if (isPushEnabled) (pushNotifications as any).disable();
      else (pushNotifications as any).enable();
    }
  };

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.notification_preferences) {
          setPrefs({ ...DEFAULT_PREFS, ...(data.notification_preferences as any) });
        }
      });
  }, [userId]);

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
    if (!userId) return;
    const previous = prefs;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: updated as any })
        .eq('id', userId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch {
      setPrefs(previous);
      toast.error('Could not save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ManagePageShell title="Notifications">
      <div className="px-4 pt-4 space-y-4">
        {/* Push */}
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
          <div className="min-w-0 pr-3">
            <p className="text-[15px] font-medium text-foreground">Push notifications</p>
            <p className="text-[13px]" style={{ color: INK_55 }}>Allow clbhouz to send push alerts</p>
          </div>
          <Switch checked={isPushEnabled} onCheckedChange={handleTogglePush} />
        </div>

        {/* In-app */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] px-1 mb-2" style={{ color: INK_55 }}>
            In-app
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
            {(Object.keys(LABELS) as (keyof NotifPrefs)[]).map((key, idx) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3 min-h-[52px]"
                style={{ borderTop: idx === 0 ? 'none' : '0.5px solid rgba(15,23,42,0.08)' }}
              >
                <p className="text-[15px] text-foreground">{LABELS[key]}</p>
                <Switch
                  checked={prefs[key]}
                  disabled={isSaving}
                  onCheckedChange={(val) => updatePref(key, val)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ManagePageShell>
  );
}
