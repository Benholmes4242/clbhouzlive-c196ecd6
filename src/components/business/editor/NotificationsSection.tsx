/**
 * NotificationsSection — D3 minimal business-level notification toggles.
 *
 * Reads/writes business_accounts.notification_preferences.muted_types.
 * Self-contained: persists immediately on toggle (independent of the
 * editor's main "Save" flow) so prefs apply right away.
 *
 * A muted type here suppresses BOTH the business inbox row AND the push
 * fan-out for every manager (enforced in the enqueue trigger).
 */
import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';

type ToggleDef = { key: string; label: string; help: string };

const TOGGLES: ToggleDef[] = [
  { key: 'like', label: 'Likes', help: 'Someone likes a post from this business.' },
  { key: 'comment', label: 'Comments', help: 'New comments and replies on business posts.' },
  { key: 'follow', label: 'New followers', help: 'When someone follows this business.' },
  { key: 'mention', label: 'Mentions', help: 'When this business is @-mentioned.' },
  { key: 'dm', label: 'Direct messages', help: 'New conversations and messages.' },
];

interface Props {
  businessId: string;
}

export function NotificationsSection({ businessId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [muted, setMuted] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_accounts')
        .select('notification_preferences')
        .eq('id', businessId)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        const prefs = (data as any).notification_preferences ?? {};
        const list: string[] = Array.isArray(prefs.muted_types) ? prefs.muted_types : [];
        setMuted(new Set(list));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  const toggle = async (key: string) => {
    const next = new Set(muted);
    // "Enabled" UI means NOT in muted_types → toggling OFF adds it.
    const willMute = !next.has(key);
    if (willMute) next.add(key);
    else next.delete(key);
    setMuted(next);
    setSaving(key);
    const { error } = await supabase
      .from('business_accounts')
      .update({ notification_preferences: { muted_types: Array.from(next) } } as any)
      .eq('id', businessId);
    setSaving(null);
    if (error) {
      // revert
      setMuted(muted);
      toast.error('Could not save notification preference');
    }
  };

  return (
    <SectionCard>
      <div className="flex items-center gap-2 mb-3">
        <Bell size={16} className="text-foreground/70" />
        <h3 className="text-[15px] font-semibold text-foreground">Notifications</h3>
      </div>
      <p className="text-[12.5px] text-muted-foreground mb-3 -mt-1">
        These apply to every manager of this business — turn off to mute that type in the business inbox and push.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
          <Loader2 size={14} className="animate-spin" /> Loading preferences…
        </div>
      ) : (
        <div className="divide-y divide-[rgba(15,23,42,0.06)]">
          {TOGGLES.map((t) => {
            const enabled = !muted.has(t.key);
            const isSaving = saving === t.key;
            return (
              <div key={t.key} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-foreground">{t.label}</div>
                  <div className="text-[12px] text-muted-foreground">{t.help}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  disabled={isSaving}
                  onClick={() => toggle(t.key)}
                  className="relative inline-flex h-[26px] w-[44px] flex-shrink-0 items-center rounded-full transition-colors"
                  style={{
                    background: enabled ? '#0F172A' : 'rgba(15,23,42,0.18)',
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  <span
                    className="inline-block h-[20px] w-[20px] rounded-full bg-white shadow transition-transform"
                    style={{ transform: enabled ? 'translateX(21px)' : 'translateX(3px)' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default NotificationsSection;
