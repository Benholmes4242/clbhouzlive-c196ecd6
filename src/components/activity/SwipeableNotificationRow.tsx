import React, { useState, useRef } from 'react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
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

const ACTION_WIDTH = 88;
const SWIPE_THRESHOLD = 10; // Minimum horizontal movement to trigger swipe

export const SwipeableNotificationRow: React.FC<SwipeableNotificationRowProps> = ({
  notification,
  onClick,
  onDelete,
  onMarkUnread,
  currentUserId,
}) => {
  const x = useMotionValue(0);
  const [isHorizontalDrag, setIsHorizontalDrag] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const snapTo = (target: number) => {
    animate(x, target, {
      type: 'spring',
      stiffness: 220,
      damping: 28,
      mass: 0.4,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startPoint.current = { x: e.clientX, y: e.clientY };
    setIsHorizontalDrag(false);
  };

  const handlePan = (_event: any, info: PanInfo) => {
    if (!startPoint.current) return;

    const dx = info.point.x - startPoint.current.x;
    const dy = info.point.y - startPoint.current.y;

    // Only treat as horizontal drag if we move more sideways than vertically
    // AND exceed the threshold
    if (!isHorizontalDrag && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      setIsHorizontalDrag(true);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsHorizontalDrag(false);
    startPoint.current = null;
    
    const offsetX = info.offset.x;

    // Swipe right = Delete
    if (offsetX > ACTION_WIDTH / 2) {
      snapTo(ACTION_WIDTH);
    }
    // Swipe left = Mark unread
    else if (offsetX < -ACTION_WIDTH / 2) {
      snapTo(-ACTION_WIDTH);
    }
    // Not far enough, snap back
    else {
      snapTo(0);
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    snapTo(0);
    setTimeout(() => {
      onDelete(notification.id);
    }, 200);
  };

  const handleMarkUnread = () => {
    snapTo(0);
    onMarkUnread(notification.id);
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-sq-md transition-all duration-200",
        isDeleting && "opacity-0 h-0 -my-1"
      )}
    >
      {/* ACTIONS LAYER */}
      <div className="absolute inset-0 flex justify-between items-stretch pointer-events-none">
        {/* Left action = Mark unread (revealed on swipe left) */}
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-slate-600 pointer-events-auto"
          style={{ width: ACTION_WIDTH }}
        >
          <button
            onClick={handleMarkUnread}
            className="flex flex-col items-center justify-center gap-1 text-white"
            aria-label="Mark as unread"
          >
            <BellOff className="h-5 w-5" />
            <span className="text-[10px] font-medium">Unread</span>
          </button>
        </div>

        {/* Right action = Delete (revealed on swipe right) */}
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-red-500 pointer-events-auto"
          style={{ width: ACTION_WIDTH }}
        >
          <button
            onClick={handleDelete}
            className="flex flex-col items-center justify-center gap-1 text-white"
            aria-label="Delete notification"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Delete</span>
          </button>
        </div>
      </div>

      {/* CARD LAYER - Swipeable */}
      <motion.div
        style={{ 
          x,
          touchAction: 'pan-y', // Let browser handle vertical scroll
        }}
        drag={isHorizontalDrag ? 'x' : false}
        dragElastic={0.12}
        dragMomentum={false}
        dragConstraints={{ left: -ACTION_WIDTH * 1.4, right: ACTION_WIDTH * 1.4 }}
        onPointerDown={handlePointerDown}
        onPan={handlePan}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-background rounded-sq-md overflow-hidden"
      >
        <ActivityNotificationRow
          notification={notification}
          onClick={onClick}
          currentUserId={currentUserId}
        />
      </motion.div>
    </div>
  );
};
