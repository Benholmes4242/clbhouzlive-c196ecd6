/**
 * HubQuickActions - Quick action buttons for Profile, Notifications, Messages
 * Replaces the single avatar in the Hub header
 */

import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface HubQuickActionsProps {
  profilePhotoUrl?: string | null;
  displayName: string;
  firstName: string;
  hasUnreadNotifications: boolean;
  unreadNotificationCount: number;
  unreadMessageCount: number;
  onProfilePrefetch?: {
    onMouseEnter: () => void;
    onTouchStart: () => void;
  };
}

export function HubQuickActions({
  profilePhotoUrl,
  displayName,
  firstName,
  hasUnreadNotifications,
  unreadNotificationCount,
  unreadMessageCount,
  onProfilePrefetch,
}: HubQuickActionsProps) {
  const navigate = useNavigate();

  const handleProfile = () => {
    onProfilePrefetch?.onTouchStart();
    haptic('light');
    navigate('/profile');
  };

  const handleNotifications = () => {
    haptic('light');
    navigate('/activity');
  };

  const handleMessages = () => {
    haptic('light');
    navigate('/messages');
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Profile */}
      <button
        onClick={handleProfile}
        onMouseEnter={onProfilePrefetch?.onMouseEnter}
        onTouchStart={onProfilePrefetch?.onTouchStart}
        className="relative w-12 h-12 rounded-full bg-card border border-border/60 shadow-sm flex items-center justify-center active:scale-[0.93] transition-transform focus-visible:outline-none focus-visible:ring-2"
        aria-label="View profile"
      >
        <SquircleAvatar
          size={44}
          src={profilePhotoUrl}
          alt={displayName}
          fallback={firstName.charAt(0).toUpperCase()}
          hideRing
        />
      </button>

      {/* Notifications */}
      <button
        onClick={handleNotifications}
        className="relative w-12 h-12 rounded-full bg-card border border-border/60 shadow-sm flex items-center justify-center active:scale-[0.93] transition-transform focus-visible:outline-none focus-visible:ring-2"
        aria-label={`Notifications${hasUnreadNotifications ? `, ${unreadNotificationCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {hasUnreadNotifications && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 rounded-full bg-orange-500 border-2 border-card flex items-center justify-center"
          >
            {unreadNotificationCount > 0 && unreadNotificationCount <= 9 && (
              <span className="text-[8px] font-bold text-white leading-none">
                {unreadNotificationCount}
              </span>
            )}
          </span>
        )}
      </button>

      {/* Messages */}
      <button
        onClick={handleMessages}
        className="relative w-12 h-12 rounded-full bg-card border border-border/60 shadow-sm flex items-center justify-center active:scale-[0.93] transition-transform focus-visible:outline-none focus-visible:ring-2"
        aria-label={`Messages${unreadMessageCount > 0 ? `, ${unreadMessageCount} unread` : ''}`}
      >
        <MessageCircle className="w-5 h-5 text-muted-foreground" />
        {unreadMessageCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center"
          >
            {unreadMessageCount <= 9 && (
              <span className="text-[8px] font-bold text-white leading-none">
                {unreadMessageCount}
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  );
}
