import React, { useRef, useState, useEffect } from 'react';
import { Archive, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableConversationItemProps {
  children: React.ReactNode;
  onArchive: () => void;
  onDelete: () => void;
  isArchived?: boolean;
}

export const SwipeableConversationItem: React.FC<SwipeableConversationItemProps> = ({
  children,
  onArchive,
  onDelete,
  isArchived = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 100;

  // Haptic feedback when threshold is reached
  useEffect(() => {
    if (Math.abs(currentX) >= SWIPE_THRESHOLD && Math.abs(currentX) < SWIPE_THRESHOLD + 5) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }, [currentX]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const diff = e.touches[0].clientX - startX;
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    
    setCurrentX(clampedDiff);
    
    if (diff > 20) {
      setSwipeDirection('right');
    } else if (diff < -20) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (currentX > SWIPE_THRESHOLD) {
      onArchive();
    } else if (currentX < -SWIPE_THRESHOLD) {
      onDelete();
    }
    
    setIsDragging(false);
    setCurrentX(0);
    setSwipeDirection(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startX;
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    
    setCurrentX(clampedDiff);
    
    if (diff > 20) {
      setSwipeDirection('right');
    } else if (diff < -20) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleMouseUp = () => {
    if (currentX > SWIPE_THRESHOLD) {
      onArchive();
    } else if (currentX < -SWIPE_THRESHOLD) {
      onDelete();
    }
    
    setIsDragging(false);
    setCurrentX(0);
    setSwipeDirection(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setCurrentX(0);
      setSwipeDirection(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      onMouseLeave={handleMouseLeave}
    >
      {/* Archive background (right swipe) - Green/Primary */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 flex items-center justify-start pl-6 transition-colors",
          swipeDirection === 'right' && currentX > SWIPE_THRESHOLD 
            ? "bg-[#25D366]" 
            : "bg-[#25D366]/80"
        )}
        style={{ width: Math.max(0, currentX) }}
      >
        <Archive 
          size={22} 
          className={cn(
            "text-white transition-transform",
            currentX > SWIPE_THRESHOLD && "scale-110"
          )} 
        />
        {currentX > 50 && (
          <span className="ml-2 text-sm font-medium text-white">
            {isArchived ? 'Unarchive' : 'Archive'}
          </span>
        )}
      </div>
      
      {/* Delete background (left swipe) - Red */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-6 transition-colors",
          swipeDirection === 'left' && currentX < -SWIPE_THRESHOLD 
            ? "bg-[#FF3B30]" 
            : "bg-[#FF3B30]/80"
        )}
        style={{ width: Math.max(0, -currentX) }}
      >
        {currentX < -50 && (
          <span className="mr-2 text-sm font-medium text-white">
            Delete
          </span>
        )}
        <Trash2 
          size={22} 
          className={cn(
            "text-white transition-transform",
            currentX < -SWIPE_THRESHOLD && "scale-110"
          )} 
        />
      </div>
      
      {/* Content */}
      <div
        className={cn(
          "relative bg-white",
          !isDragging && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${currentX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {children}
      </div>
    </div>
  );
};
