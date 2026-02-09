/**
 * HubQuickActions - Quick action buttons for Notifications + Profile
 * Layout: [Bell circle] [Profile avatar circle]
 */

import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
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

  // Format badge count: show number up to 99, then "99+"
  const formatCount = (count: number) => {
    if (count > 99) return '99+';
    return String(count);
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Notifications — circular container matching avatar size */}
      <button
        onClick={handleNotifications}
        className="relative w-12 h-12 bg-card border border-border/60 shadow-sm flex items-center justify-center active:scale-[0.93] transition-transform focus-visible:outline-none focus-visible:ring-2"
        style={{ borderRadius: '34%' }}
        aria-label={`Notifications${hasUnreadNotifications ? `, ${unreadNotificationCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {hasUnreadNotifications && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-orange-500 border-2 border-card flex items-center justify-center px-1"
          >
            <span className="text-[11px] font-bold text-white leading-none">
              {formatCount(unreadNotificationCount)}
            </span>
          </span>
        )}
        {/* Message unread dot — shown on bell as secondary indicator */}
        {unreadMessageCount > 0 && (
          <span
            className="absolute -bottom-0.5 -right-0.5 min-w-[20px] h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center px-1"
          >
            <span className="text-[11px] font-bold text-white leading-none">
              {formatCount(unreadMessageCount)}
            </span>
          </span>
        )}
      </button>

      {/* Profile avatar — far right */}
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
    </div>
  );
}
