import React from 'react';
import { Bell, BellOff, Trash2, BellMinus, UserX } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        <SheetHeader className="text-left border-b border-border/40 pb-3" aria-label="Notification options">
          <SheetTitle className="text-[1rem] font-semibold">Notification options</SheetTitle>
        </SheetHeader>
        
        <div className="p-2 space-y-1">
          <button
            onClick={handleToggleRead}
            className="w-full flex items-center gap-3 px-4 min-h-[44px] text-left rounded-sq-sm hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,50%)]/40 focus-visible:ring-offset-2"
            aria-label={isUnread ? 'Mark notification as read' : 'Mark notification as unread'}
          >
            {isUnread ? (
              <>
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="text-[0.875rem] font-medium">Mark as read</span>
              </>
            ) : (
              <>
                <BellOff className="h-5 w-5 text-muted-foreground" />
                <span className="text-[0.875rem] font-medium">Mark as unread</span>
              </>
            )}
          </button>

          <button
            onClick={handleMuteType}
            className="w-full flex items-center gap-3 px-4 min-h-[44px] text-left rounded-sq-sm hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,50%)]/40 focus-visible:ring-offset-2"
            aria-label={`Mute ${notificationType.replace(/_/g, ' ')} notifications`}
          >
            <BellMinus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[0.875rem] font-medium">Mute {notificationType.replace(/_/g, ' ')} notifications</span>
          </button>

          {actorId && notification.actor_type === 'user' && (
            <button
              onClick={handleMuteUser}
              className="w-full flex items-center gap-3 px-4 min-h-[44px] text-left rounded-sq-sm hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,50%)]/40 focus-visible:ring-offset-2"
              aria-label={`Mute notifications from ${actorName}`}
            >
              <UserX className="h-5 w-5 text-muted-foreground" />
              <span className="text-[0.875rem] font-medium">Mute {actorName}</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 min-h-[44px] text-left rounded-sq-sm hover:bg-destructive/10 transition-colors text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            aria-label="Delete notification"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-[0.875rem] font-medium">Delete notification</span>
          </button>
        </div>

        <div className="h-[env(safe-area-inset-bottom)]" />
      </SheetContent>
    </Sheet>
  );
};