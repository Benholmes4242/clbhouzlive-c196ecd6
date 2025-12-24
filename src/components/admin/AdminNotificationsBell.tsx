import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminNotifications, AdminNotification } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminBottomSheet } from "@/components/admin/mobile/AdminBottomSheet";

// Human-readable notification copy
const NOTIFICATION_COPY: Record<string, { icon: string; formatTitle: (n: AdminNotification) => string; formatMessage: (n: AdminNotification) => string }> = {
  verification_request: {
    icon: "📋",
    formatTitle: () => "New verification request",
    formatMessage: (n) => {
      const meta = n.metadata as Record<string, unknown>;
      const type = meta?.type as string || "business";
      const name = meta?.name as string || "";
      return name 
        ? `${type === "golfer" ? "A golfer" : "A business"} has requested verification: ${name}`
        : `A ${type} has requested verification`;
    },
  },
  invite_accepted: {
    icon: "✅",
    formatTitle: () => "Admin invite accepted",
    formatMessage: (n) => {
      const meta = n.metadata as Record<string, unknown>;
      const email = meta?.email as string || "";
      return email ? `${email} is now an admin` : "A new admin has joined";
    },
  },
  expiring_access: {
    icon: "⏰",
    formatTitle: () => "Admin access expiring",
    formatMessage: (n) => {
      const meta = n.metadata as Record<string, unknown>;
      const email = meta?.email as string || "";
      const expiresIn = meta?.expires_in as string || "soon";
      return email 
        ? `${email}'s access expires ${expiresIn}`
        : `Admin access expires ${expiresIn}`;
    },
  },
  bulk_verification_complete: {
    icon: "📦",
    formatTitle: () => "Bulk verification completed",
    formatMessage: (n) => {
      const meta = n.metadata as Record<string, unknown>;
      const approved = meta?.approved as number || 0;
      const failed = meta?.failed as number || 0;
      if (failed > 0) {
        return `Approved ${approved} requests, ${failed} failed`;
      }
      return `Approved ${approved} requests`;
    },
  },
  bulk_invites_revoked: {
    icon: "🗑️",
    formatTitle: () => "Invites revoked",
    formatMessage: (n) => {
      const meta = n.metadata as Record<string, unknown>;
      const count = meta?.count as number || 0;
      return `${count} invite${count !== 1 ? "s" : ""} revoked`;
    },
  },
  admin_role_changed: {
    icon: "🔐",
    formatTitle: () => "Admin role updated",
    formatMessage: (n) => {
      const meta = n.metadata as Record<string, unknown>;
      const email = meta?.email as string || "";
      const action = meta?.action as string || "changed";
      return email ? `${email}'s role was ${action}` : `An admin role was ${action}`;
    },
  },
};

// Fallback for unknown types
const DEFAULT_COPY = {
  icon: "🔔",
  formatTitle: (n: AdminNotification) => n.title,
  formatMessage: (n: AdminNotification) => n.message,
};

function getNotificationCopy(notification: AdminNotification) {
  return NOTIFICATION_COPY[notification.type] || DEFAULT_COPY;
}

// Deep link mapping
function getNotificationLink(notification: AdminNotification): string {
  const meta = notification.metadata as Record<string, unknown>;
  
  switch (notification.type) {
    case "verification_request":
      const verType = meta?.type as string;
      const requestId = meta?.request_id as string;
      if (verType === "golfer") {
        return requestId 
          ? `/admin/verification?tab=golfer&request=${requestId}`
          : "/admin/verification?tab=golfer";
      }
      return requestId 
        ? `/admin/verification?tab=business&request=${requestId}`
        : "/admin/verification?tab=business";
    
    case "invite_accepted":
      const userId = meta?.user_id as string;
      return userId ? `/admin/admins?user=${userId}` : "/admin/admins";
    
    case "expiring_access":
      return "/admin/admins";
    
    case "bulk_verification_complete":
      return "/admin/audit";
    
    case "bulk_invites_revoked":
      return "/admin/audit";
    
    case "admin_role_changed":
      return "/admin/admins";
    
    default:
      return notification.link || "/admin";
  }
}

interface NotificationItemProps {
  notification: AdminNotification;
  isRead: boolean;
  onClick: () => void;
}

function NotificationItem({ notification, isRead, onClick }: NotificationItemProps) {
  const copy = getNotificationCopy(notification);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
        !isRead && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{copy.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm", !isRead && "font-medium")}>
              {copy.formatTitle(notification)}
            </span>
            {!isRead && (
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {copy.formatMessage(notification)}
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
    const link = getNotificationLink(notification);
    navigate(link);
    setOpen(false);
    setMobileOpen(false);
  };

  // Group notifications by Today/Earlier
  const todayNotifications = notifications.filter(n => isToday(parseISO(n.created_at)));
  const earlierNotifications = notifications.filter(n => !isToday(parseISO(n.created_at)));

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
            className="text-xs h-7 gap-1.5"
            onClick={() => markAllAsRead()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
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
            <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up</p>
          </div>
        ) : (
          <>
            {/* Today section */}
            {todayNotifications.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0">
                  Today
                </div>
                {todayNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isRead={isRead(notification)}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </>
            )}
            
            {/* Earlier section */}
            {earlierNotifications.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0">
                  Earlier
                </div>
                {earlierNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isRead={isRead(notification)}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </>
            )}
          </>
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
