import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminNotifications, AdminNotification } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminBottomSheet } from "@/components/admin/mobile/AdminBottomSheet";

const NOTIFICATION_ICONS: Record<string, string> = {
  verification_request: "📋",
  invite_accepted: "✅",
  expiring_access: "⏰",
  bulk_complete: "📦",
};

interface NotificationItemProps {
  notification: AdminNotification;
  isRead: boolean;
  onClick: () => void;
}

function NotificationItem({ notification, isRead, onClick }: NotificationItemProps) {
  const icon = NOTIFICATION_ICONS[notification.type] ?? "🔔";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
        !isRead && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm", !isRead && "font-medium")}>
              {notification.title}
            </span>
            {!isRead && (
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  );
}

export function AdminNotificationsBell() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isRead,
  } = useAdminNotifications();

  const handleNotificationClick = (notification: AdminNotification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setOpen(false);
    setMobileOpen(false);
  };

  const bellButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => isMobile ? setMobileOpen(true) : undefined}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );

  const notificationContent = (
    <>
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-medium text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => markAllAsRead()}
          >
            Mark all read
          </Button>
        )}
      </div>
      <ScrollArea className="h-[300px] md:h-[400px]">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isRead={isRead(notification)}
              onClick={() => handleNotificationClick(notification)}
            />
          ))
        )}
      </ScrollArea>
    </>
  );

  if (isMobile) {
    return (
      <>
        {bellButton}
        <AdminBottomSheet
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Notifications"
        >
          {notificationContent}
        </AdminBottomSheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {notificationContent}
      </PopoverContent>
    </Popover>
  );
}
