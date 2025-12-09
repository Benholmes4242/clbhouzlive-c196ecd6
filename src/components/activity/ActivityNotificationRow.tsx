import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Heart, MessageCircle, UserPlus, Users, Bell, Mail } from 'lucide-react';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface ActivityNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return <Heart className="h-3 w-3 text-rose-500" />;
    case 'comment':
    case 'mention':
      return <MessageCircle className="h-3 w-3 text-blue-500" />;
    case 'follow':
      return <UserPlus className="h-3 w-3 text-emerald-500" />;
    case 'friend_request':
    case 'friend_accepted':
      return <Users className="h-3 w-3 text-amber-500" />;
    case 'message':
    case 'dm':
      return <Mail className="h-3 w-3 text-violet-500" />;
    default:
      return <Bell className="h-3 w-3 text-muted-foreground" />;
  }
}

function renderNotificationText(notification: ActivityNotification): React.ReactNode {
  const { type, message, title } = notification;
  
  switch (type) {
    case 'like':
      return 'liked your moment';
    case 'comment':
      return message ? `commented: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"` : 'commented on your moment';
    case 'mention':
      return 'mentioned you in a post';
    case 'tag':
      return 'tagged you in a moment';
    case 'follow':
      return 'started following you';
    case 'friend_request':
      return 'sent you a friend request';
    case 'friend_accepted':
      return 'accepted your friend request';
    case 'message':
    case 'dm':
      return message ? `sent you a message: "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}"` : 'sent you a message';
    case 'new_post':
      return 'shared a new moment';
    case 'achievement':
      return 'earned a new achievement';
    case 'club_update':
    case 'course_update':
      return title || 'posted an update';
    case 'system':
    case 'app_update':
      return title || 'New update available';
    default:
      return title || message || 'New notification';
  }
}

function renderRightAction(notification: ActivityNotification): React.ReactNode {
  const { type } = notification;
  
  if (type === 'follow') {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-sq-pill border border-border bg-background text-foreground">
        View
      </span>
    );
  }
  
  if (type === 'friend_request') {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-sq-pill bg-foreground text-background">
        Respond
      </span>
    );
  }
  
  if (type === 'message' || type === 'dm') {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-sq-pill border border-border bg-background text-foreground">
        Open
      </span>
    );
  }
  
  // Default: chevron
  return <ChevronRight className="h-4 w-4 text-muted-foreground" />;
}

export const ActivityNotificationRow: React.FC<ActivityNotificationRowProps> = ({ 
  notification, 
  onClick 
}) => {
  const isUnread = !notification.is_read;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 text-left bg-transparent transition-colors",
        "hover:bg-accent/50 active:bg-accent"
      )}
    >
      {/* Unread accent bar */}
      <div className="flex flex-col h-full items-center self-stretch">
        <div
          className={cn(
            "w-1 rounded-full self-stretch min-h-[40px]",
            isUnread ? "bg-primary" : "bg-transparent"
          )}
        />
      </div>

      {/* Avatar with type icon overlay */}
      <div className="relative flex-shrink-0">
        <SquircleAvatar
          src={notification.actor_avatar_url}
          alt={notification.actor_display_name || 'User'}
          size={40}
          fallback={notification.actor_display_name?.charAt(0) || '?'}
        />
        <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center">
          {getNotificationIcon(notification.type)}
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        {/* DEBUG: Force visible with inline styles */}
        <p style={{ color: '#000000', fontSize: '14px', fontWeight: 600, opacity: 1, visibility: 'visible' }}>
          {notification.actor_display_name || 'Unknown User'}{' '}
          <span style={{ color: '#475569', fontWeight: 400 }}>
            {renderNotificationText(notification)}
          </span>
        </p>
        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', opacity: 1, visibility: 'visible' }}>
          {notification.time_ago} · {notification.context_label}
        </p>
      </div>

      {/* Right-side action */}
      <div className="flex-shrink-0">
        {renderRightAction(notification)}
      </div>
    </button>
  );
};
