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
import { ACT } from './ledgerKinds';
import { A } from '@/features/courses/components/holes/analytical/tokens';

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
  borderBottom: `0.5px solid ${ACT.HAIR}`,
  cursor: 'pointer',
  textAlign: 'left',
};

export const ActivityActionsSheet: React.FC<Props> = ({ open, row, onClose }) => {
  const { user } = useSupabaseSession();
  const qc = useQueryClient();

  if (!row) return null;

  const type = row.notif_type;
  /**
   * MUTE THE THING THE BUTTON NAMES. The label reads actor_display_name, which
   * since the business-actor work is the BUSINESS on a business-sourced row,
   * while actor_user_id stays the PERSON who acted. Writing the person's id
   * behind a "Mute clbhouz" label silenced somebody the member never chose.
   * So the target follows actor_kind:
   *   business -> actor_route_id  -> muted_business_ids  (one mute covers that
   *               business's mentions AND its posts — both carry
   *               source_actor_type = 'business')
   *   personal -> actor_user_id   -> muted_user_ids      (unchanged)
   */
  const isBusinessActor = row.actor_kind === 'business';
  const muteTargetId = isBusinessActor ? row.actor_route_id : row.actor_user_id;
  const actorName = row.actor_display_name || row.actor_username || 'this user';

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['activity-v2'] });
    qc.invalidateQueries({ queryKey: ['activity-feed'] });
    qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
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

  const handleMuteActor = async () => {
    if (!user?.id || !muteTargetId) return;
    const column = isBusinessActor ? 'muted_business_ids' : 'muted_user_ids';
    try {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('muted_user_ids, muted_business_ids')
        .eq('user_id', user.id)
        .maybeSingle();
      const cur: string[] =
        ((existing as Record<string, string[] | null> | null)?.[column] as string[] | null) || [];
      if (!cur.includes(muteTargetId)) {
        await supabase
          .from('notification_preferences')
          .upsert(
            { user_id: user.id, [column]: [...cur, muteTargetId] },
            { onConflict: 'user_id' },
          );
        invalidate();
        toast.success('Muted', {
          description: `You won't see notifications from ${actorName} anymore.`,
        });
      }
    } catch (err) {
      console.error('[ActivityActionsSheet] muteActor failed', err);
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
        // §4.2 was an ARBITRARY TAILWIND VALUE, bg-[#F8FAFC] — invisible to a hex
        // grep of style objects. The surface is now the app panel.
        className="rounded-t-[20px]"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          background: A.PANEL,
          borderColor: ACT.HAIR,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        <div style={{ padding: '6px 20px 14px', borderBottom: `0.5px solid ${ACT.HAIR}` }}>
          <span
            style={{
              // READ 11 floor (sheet eyebrow).
              fontSize: 11,
              fontWeight: 700,
              color: ACT.INK_45,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Notification options
          </span>
        </div>

        <div>
          <button onClick={handleMuteType} style={rowStyle}>
            <BellMinus className="h-5 w-5" style={{ color: ACT.INK_45 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: ACT.INK }}>
              Mute {type.replace(/_/g, ' ')} notifications
            </span>
          </button>

          {actorId && (
            <button onClick={handleMuteUser} style={rowStyle}>
              <UserX className="h-5 w-5" style={{ color: ACT.INK_45 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: ACT.INK }}>
                Mute {actorName}
              </span>
            </button>
          )}

          <button onClick={handleDelete} style={{ ...rowStyle, borderBottom: 'none' }}>
            <Trash2 className="h-5 w-5" style={{ color: ACT.RED }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: ACT.RED }}>
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
