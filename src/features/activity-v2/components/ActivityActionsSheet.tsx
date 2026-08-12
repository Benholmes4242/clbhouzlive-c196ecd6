/**
 * ActivityActionsSheet — long-press action sheet for Activity V2 rows.
 * Actions: mute this notif type, mute the actor user, delete notification.
 * Writes mirror the legacy path in
 *   src/components/activity/NotificationActionsSheet.tsx
 * (notification_preferences.muted_types / muted_user_ids upsert on
 *  user_id conflict; notifications.is_deleted=true for delete).
 */

import React from 'react';
import { BellMinus, UserX, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { ActivityFeedRowV2 } from '../hooks/useActivityFeedV2';

interface Props {
  open: boolean;
  row: ActivityFeedRowV2 | null;
  onClose: () => void;
}

const rowStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 20px',
  background: 'transparent',
  border: 'none',
  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
  cursor: 'pointer',
  textAlign: 'left',
};

export const ActivityActionsSheet: React.FC<Props> = ({ open, row, onClose }) => {
  const { user } = useSupabaseSession();
  const qc = useQueryClient();

  if (!row) return null;

  const type = row.notif_type;
  const actorId = row.actor_user_id;
  const actorName = row.actor_display_name || row.actor_username || 'this user';

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['activity-v2'] });
    qc.invalidateQueries({ queryKey: ['activity-feed'] });
  };

  const handleMuteType = async () => {
    if (!user?.id) return;
    try {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('muted_types')
        .eq('user_id', user.id)
        .maybeSingle();
      const cur: string[] = existing?.muted_types || [];
      if (!cur.includes(type)) {
        await supabase
          .from('notification_preferences')
          .upsert(
            { user_id: user.id, muted_types: [...cur, type] },
            { onConflict: 'user_id' },
          );
        invalidate();
        toast.success('Notifications muted', {
          description: `You won't see ${type.replace(/_/g, ' ')} notifications anymore.`,
        });
      }
    } catch (err) {
      console.error('[ActivityActionsSheet] muteType failed', err);
    }
    onClose();
  };

  const handleMuteUser = async () => {
    if (!user?.id || !actorId) return;
    try {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('muted_user_ids')
        .eq('user_id', user.id)
        .maybeSingle();
      const cur: string[] = existing?.muted_user_ids || [];
      if (!cur.includes(actorId)) {
        await supabase
          .from('notification_preferences')
          .upsert(
            { user_id: user.id, muted_user_ids: [...cur, actorId] },
            { onConflict: 'user_id' },
          );
        invalidate();
        toast.success('User muted', {
          description: `You won't see notifications from ${actorName} anymore.`,
        });
      }
    } catch (err) {
      console.error('[ActivityActionsSheet] muteUser failed', err);
    }
    onClose();
  };

  const handleDelete = async () => {
    // Optimistic removal across all activity-v2 pages
    type FeedCache = { pages: ActivityFeedRowV2[][]; pageParams: unknown[] };
    qc.setQueriesData<FeedCache>({ queryKey: ['activity-v2'] }, (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((p) => p.filter((r) => r.notif_id !== row.notif_id)),
      };
    });
    try {
      await supabase.from('notifications').update({ is_deleted: true }).eq('id', row.notif_id);
      qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
    } catch (err) {
      console.error('[ActivityActionsSheet] delete failed', err);
      invalidate();
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-[#F8FAFC]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
        </div>

        <div style={{ padding: '6px 20px 14px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#64748B',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Notification options
          </span>
        </div>

        <div>
          <button onClick={handleMuteType} style={rowStyle}>
            <BellMinus className="h-5 w-5" style={{ color: '#94A3B8' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
              Mute {type.replace(/_/g, ' ')} notifications
            </span>
          </button>

          {actorId && (
            <button onClick={handleMuteUser} style={rowStyle}>
              <UserX className="h-5 w-5" style={{ color: '#94A3B8' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                Mute {actorName}
              </span>
            </button>
          )}

          <button onClick={handleDelete} style={{ ...rowStyle, borderBottom: 'none' }}>
            <Trash2 className="h-5 w-5" style={{ color: '#DC2626' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>
              Delete notification
            </span>
          </button>
        </div>

        <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 8px)' }} />
      </SheetContent>
    </Sheet>
  );
};

export default ActivityActionsSheet;
