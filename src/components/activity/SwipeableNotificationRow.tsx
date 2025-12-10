import React, { useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Trash2, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from './ActivityNotificationRow';

interface SwipeableNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onDelete: (id: string) => void;
  onMarkUnread: (id: string) => void;
  currentUserId?: string;
}

const SWIPE_THRESHOLD = 80;

export const SwipeableNotificationRow: React.FC<SwipeableNotificationRowProps> = ({
  notification,
  onClick,
  onDelete,
  onMarkUnread,
  currentUserId,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      // Limit swipe distance
      const maxSwipe = 120;
      const x = Math.max(-maxSwipe, Math.min(maxSwipe, e.deltaX));
      setOffsetX(x);
    },
    onSwipedLeft: (e) => {
      if (Math.abs(e.deltaX) > SWIPE_THRESHOLD) {
        // Mark as unread action
        onMarkUnread(notification.id);
      }
      setOffsetX(0);
    },
    onSwipedRight: (e) => {
      if (Math.abs(e.deltaX) > SWIPE_THRESHOLD) {
        // Delete action
        setIsDeleting(true);
        setTimeout(() => {
          onDelete(notification.id);
        }, 200);
      } else {
        setOffsetX(0);
      }
    },
    onSwiped: () => {
      if (!isDeleting) {
        setOffsetX(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  const showDeleteAction = offsetX > 20;
  const showUnreadAction = offsetX < -20;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-sq-md transition-all duration-200",
        isDeleting && "opacity-0 h-0 -my-1"
      )}
    >
      {/* Delete action background (swipe right) */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-red-500 transition-opacity",
          showDeleteAction ? "opacity-100" : "opacity-0"
        )}
        style={{ width: Math.max(0, offsetX) }}
      >
        <Trash2 className="h-5 w-5 text-white" />
        {offsetX > 60 && (
          <span className="ml-2 text-sm font-medium text-white">Delete</span>
        )}
      </div>

      {/* Mark unread action background (swipe left) */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-slate-500 transition-opacity",
          showUnreadAction ? "opacity-100" : "opacity-0"
        )}
        style={{ width: Math.max(0, -offsetX) }}
      >
        {offsetX < -60 && (
          <span className="mr-2 text-sm font-medium text-white">Mark unread</span>
        )}
        <BellOff className="h-5 w-5 text-white" />
      </div>

      {/* Main content - slideable */}
      <div
        {...handlers}
        style={{ 
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        className="relative bg-background"
      >
        <ActivityNotificationRow
          notification={notification}
          onClick={onClick}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
};
