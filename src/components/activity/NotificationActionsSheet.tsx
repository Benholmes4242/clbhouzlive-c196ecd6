import React from 'react';
import { Bell, BellOff, Trash2, BellMinus, UserX } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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

  // Mute notification type (Fix 8)
  const handleMuteType = async () => {
    if (!user?.id) return;
    
    try {
      // Upsert preferences with the new muted type
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
        toast({
          title: "Notifications muted",
          description: `You won't see ${notificationType.replace(/_/g, ' ')} notifications anymore.`,
        });
      }
    } catch (error) {
      console.error('Failed to mute type:', error);
    }
    
    onClose();
  };

  // Mute notifications from user (Fix 8)
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
        toast({
          title: "User muted",
          description: `You won't see notifications from ${actorName} anymore.`,
        });
      }
    } catch (error) {
      console.error('Failed to mute user:', error);
    }
    
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left border-b border-border/40 pb-3" aria-label="Notification options">
          <DrawerTitle className="text-[1rem] font-semibold">Notification options</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-2 space-y-1">
          <button
            onClick={handleToggleRead}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-sq-sm hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

          {/* Mute notification type */}
          <button
            onClick={handleMuteType}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-sq-sm hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`Mute ${notificationType.replace(/_/g, ' ')} notifications`}
          >
            <BellMinus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[0.875rem] font-medium">Mute {notificationType.replace(/_/g, ' ')} notifications</span>
          </button>

          {/* Mute notifications from user */}
          {actorId && notification.actor_type === 'user' && (
            <button
              onClick={handleMuteUser}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-sq-sm hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Mute notifications from ${actorName}`}
            >
              <UserX className="h-5 w-5 text-muted-foreground" />
              <span className="text-[0.875rem] font-medium">Mute {actorName}</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-sq-sm hover:bg-destructive/10 transition-colors text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            aria-label="Delete notification"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-[0.875rem] font-medium">Delete notification</span>
          </button>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </DrawerContent>
    </Drawer>
  );
};
