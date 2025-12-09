import React from 'react';
import { ChevronRight, Heart, MessageCircle, UserPlus, Users, Bell, Mail } from 'lucide-react';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface ActivityNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
}

function getNotificationIcon(type: string) {
  const iconStyle = { width: '12px', height: '12px' };
  switch (type) {
    case 'like':
      return <Heart style={{ ...iconStyle, color: '#f43f5e' }} />;
    case 'comment':
    case 'mention':
      return <MessageCircle style={{ ...iconStyle, color: '#3b82f6' }} />;
    case 'follow':
      return <UserPlus style={{ ...iconStyle, color: '#10b981' }} />;
    case 'friend_request':
    case 'friend_accepted':
      return <Users style={{ ...iconStyle, color: '#f59e0b' }} />;
    case 'message':
    case 'dm':
      return <Mail style={{ ...iconStyle, color: '#8b5cf6' }} />;
    default:
      return <Bell style={{ ...iconStyle, color: '#64748b' }} />;
  }
}

function renderNotificationText(notification: ActivityNotification): string {
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
  
  const pillStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '999px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
  };
  
  if (type === 'follow') {
    return (
      <span style={{ 
        ...pillStyle,
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        color: '#1f2428'
      }}>
        View
      </span>
    );
  }
  
  if (type === 'friend_request') {
    return (
      <span style={{ 
        ...pillStyle,
        backgroundColor: '#1f2428',
        color: '#ffffff'
      }}>
        Respond
      </span>
    );
  }
  
  if (type === 'message' || type === 'dm') {
    return (
      <span style={{ 
        ...pillStyle,
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        color: '#1f2428'
      }}>
        Open
      </span>
    );
  }
  
  return <ChevronRight style={{ width: '16px', height: '16px', color: '#94a3b8' }} />;
}

export const ActivityNotificationRow: React.FC<ActivityNotificationRowProps> = ({ 
  notification, 
  onClick 
}) => {
  const isUnread = !notification.is_read;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        textAlign: 'left',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      {/* Unread accent bar */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        alignSelf: 'stretch' 
      }}>
        <div
          style={{
            width: '4px',
            borderRadius: '999px',
            alignSelf: 'stretch',
            minHeight: '40px',
            backgroundColor: isUnread ? '#F7931E' : 'transparent'
          }}
        />
      </div>

      {/* Avatar with type icon overlay */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <SquircleAvatar
          src={notification.actor_avatar_url}
          alt={notification.actor_display_name || 'User'}
          size={40}
          fallback={notification.actor_display_name?.charAt(0) || '?'}
        />
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {getNotificationIcon(notification.type)}
        </div>
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ 
          color: '#0f172a', 
          fontSize: '14px', 
          fontWeight: 600,
          margin: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          lineHeight: 1.4
        }}>
          {notification.actor_display_name || 'Unknown User'}{' '}
          <span style={{ 
            color: '#475569', 
            fontWeight: 400 
          }}>
            {renderNotificationText(notification)}
          </span>
        </p>
        <p style={{ 
          color: '#64748b', 
          fontSize: '12px', 
          margin: 0,
          marginTop: '2px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          {notification.time_ago} · {notification.context_label}
        </p>
      </div>

      {/* Right-side action */}
      <div style={{ flexShrink: 0 }}>
        {renderRightAction(notification)}
      </div>
    </button>
  );
};