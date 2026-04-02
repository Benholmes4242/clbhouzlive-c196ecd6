import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

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
  follows: 'New Followers',
  messages: 'Messages',
  mentions: 'Mentions',
  tour_updates: 'Tour Updates',
};

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function NotificationsSheet({ open, onClose, userId }: Props) {
  const queryClient = useQueryClient();
  const pushNotifications = usePushNotifications();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [isSaving, setIsSaving] = useState(false);

  // Derive push enabled state from available API
  const isPushEnabled = 'isSubscribed' in pushNotifications
    ? (pushNotifications as any).isSubscribed
    : (pushNotifications as any).state === 'enabled';

  const handleTogglePush = () => {
    if ('requestPermission' in pushNotifications && 'unsubscribe' in pushNotifications) {
      if (isPushEnabled) {
        (pushNotifications as any).unsubscribe();
      } else {
        (pushNotifications as any).requestPermission();
      }
    } else if ('enable' in pushNotifications && 'disable' in pushNotifications) {
      if (isPushEnabled) {
        (pushNotifications as any).disable();
      } else {
        (pushNotifications as any).enable();
      }
    }
  };

  useEffect(() => {
    if (!userId || !open) return;
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
  }, [userId, open]);

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
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
      setPrefs(prefs);
      toast.error('Could not save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-background border-0 px-5"
        style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Notifications</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Push toggle */}
        <div className="flex items-center justify-between py-3 border-b border-border mb-3">
          <div>
            <p className="text-[15px] font-medium text-foreground">Push Notifications</p>
            <p className="text-[13px] text-muted-foreground">Allow Clbhouz to send push alerts</p>
          </div>
          <Switch checked={isPushEnabled} onCheckedChange={handleTogglePush} />
        </div>

        {/* Temporary debug button */}
        <button
          onClick={() => {
            const os = (window as any).median?.onesignal;
            if (!os) { toast.error('No onesignal bridge'); return; }
            
            // Try the newer 'info' method first
            if (os.info) {
              os.info((result: any) => {
                toast.info(`INFO: ${JSON.stringify(result).slice(0, 120)}`);
              });
            } else if (os.onesignalInfo) {
              os.onesignalInfo((result: any) => {
                toast.info(`OSINFO: ${JSON.stringify(result).slice(0, 120)}`);
              });
            } else {
              toast.error('Neither info nor onesignalInfo available');
            }
          }}
          className="text-xs text-amber-500 mt-2 py-1"
        >
          Debug OneSignal
        </button>

        {/* In-app prefs */}
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground mb-3">In-App</p>
        <div className="space-y-1">
          {(Object.keys(LABELS) as (keyof NotifPrefs)[]).map((key) => (
            <div key={key} className="flex items-center justify-between min-h-[44px]">
              <p className="text-[15px] text-foreground">{LABELS[key]}</p>
              <Switch
                checked={prefs[key]}
                disabled={isSaving}
                onCheckedChange={(val) => updatePref(key, val)}
              />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
