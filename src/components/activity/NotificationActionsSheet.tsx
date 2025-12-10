import React from 'react';
import { Bell, BellOff, Trash2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ActivityNotification } from '@/hooks/useActivityFeed';

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
  if (!notification) return null;

  const isUnread = notification.is_unread;

  const handleToggleRead = () => {
    onToggleRead(notification);
    onClose();
  };

  const handleDelete = () => {
    onDelete(notification);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left border-b border-border/40 pb-3">
          <DrawerTitle className="text-base font-semibold">Notification options</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-2 space-y-1">
          <button
            onClick={handleToggleRead}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-sq-sm hover:bg-muted/60 transition-colors"
          >
            {isUnread ? (
              <>
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Mark as read</span>
              </>
            ) : (
              <>
                <BellOff className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Mark as unread</span>
              </>
            )}
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-sq-sm hover:bg-red-500/10 transition-colors text-red-600"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-medium">Delete notification</span>
          </button>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </DrawerContent>
    </Drawer>
  );
};
