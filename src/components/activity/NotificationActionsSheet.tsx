import React from 'react';
import { Bell, BellOff, Trash2, BellMinus, UserX } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface NotificationActionsSheetProps {
  open: boolean;
  notification: ActivityNotification | null;
  onClose: () => void;
  onToggleRead: (notification: ActivityNotification) => void;
  onDelete: (notification: ActivityNotification) => void;
}

export const NotificationActionsSheet: React.FC<NotificationActionsSheetProps> = ({
  open,
  notification,
  onClose,
  onToggleRead,
  onDelete,
}) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  if (!notification) return null;

  const isUnread = notification.is_unread;
  const notificationType = notification.type;
  const actorId = notification.actor_id;
  const actorName = notification.actor_display_name;

  const handleToggleRead = () => {
    onToggleRead(notification);
    onClose();
  };

  const handleDelete = () => {
    onDelete(notification);
    onClose();
  };

  const handleMuteType = async () => {
    if (!user?.id) return;
    
    try {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('muted_types')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const currentTypes = existing?.muted_types || [];
      if (!currentTypes.includes(notificationType)) {
        const newTypes = [...currentTypes, notificationType];
        
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            muted_types: newTypes,
          }, { onConflict: 'user_id' });
        
        queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
        toast.success("Notifications muted", {
          description: `You won't see ${notificationType.replace(/_/g, ' ')} notifications anymore.`,
        });
      }
    } catch (error) {
      console.error('Failed to mute type:', error);
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
      
      const currentIds = existing?.muted_user_ids || [];
      if (!currentIds.includes(actorId)) {
        const newIds = [...currentIds, actorId];
        
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            muted_user_ids: newIds,
          }, { onConflict: 'user_id' });
        
        queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
        toast.success("User muted", {
          description: `You won't see notifications from ${actorName} anymore.`,
        });
      }
    } catch (error) {
      console.error('Failed to mute user:', error);
    }
    
    onClose();
  };

  const rowStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px', background: 'transparent', border: 'none',
    borderBottom: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer',
    textAlign: 'left' as const,
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-[#F8FAFC]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Dispatch handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
        </div>

        {/* Dispatch eyebrow header */}
        <div style={{ padding: '6px 20px 14px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 12, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Notification options
            </span>
          </div>
        </div>

        {/* Flat action rows */}
        <div>
          <button
            onClick={handleToggleRead}
            style={rowStyle}
            aria-label={isUnread ? 'Mark notification as read' : 'Mark notification as unread'}
          >
            {isUnread
              ? <Bell className="h-5 w-5" style={{ color: '#94A3B8' }} />
              : <BellOff className="h-5 w-5" style={{ color: '#94A3B8' }} />
            }
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
              {isUnread ? 'Mark as read' : 'Mark as unread'}
            </span>
          </button>

          <button
            onClick={handleMuteType}
            style={rowStyle}
            aria-label={`Mute ${notificationType.replace(/_/g, ' ')} notifications`}
          >
            <BellMinus className="h-5 w-5" style={{ color: '#94A3B8' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
              Mute {notificationType.replace(/_/g, ' ')} notifications
            </span>
          </button>

          {actorId && notification.actor_type === 'user' && (
            <button
              onClick={handleMuteUser}
              style={rowStyle}
              aria-label={`Mute notifications from ${actorName}`}
            >
              <UserX className="h-5 w-5" style={{ color: '#94A3B8' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                Mute {actorName}
              </span>
            </button>
          )}

          <button
            onClick={handleDelete}
            style={{ ...rowStyle, borderBottom: 'none' }}
            aria-label="Delete notification"
          >
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
