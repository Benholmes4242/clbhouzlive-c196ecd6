/**
 * SwipeableHistoryRow - History row with swipe actions for star & delete
 * Apple-style interactions with haptic feedback
 */

import React, { useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { HistoryRow, HistoryRowProps } from './HistoryRow';
import { haptic } from '@/utils/haptics';
import { Star, Trash2 } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';
import { EchoHistorySearchFilters } from '../hooks/useEchoHistorySearch';

interface SwipeableHistoryRowProps extends Omit<HistoryRowProps, 'onClick'> {
  isStarred: boolean;
  onStar: () => void;
  onDelete: () => void;
  onClick: () => void;
  listFilters?: Partial<EchoHistorySearchFilters>;
  rankIndex?: number;
  isPendingDelete?: boolean;
}

export const SwipeableHistoryRow: React.FC<SwipeableHistoryRowProps> = ({
  isStarred,
  onStar,
  onDelete,
  onClick,
  listFilters,
  rankIndex,
  isPendingDelete,
  ...historyRowProps
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const isDesktop = useMedia('(min-width: 1024px)');
  const containerRef = useRef<HTMLDivElement>(null);
  const actionTriggered = useRef(false);
  const swipeStartTime = useRef<number>(0);
  const swipeStartX = useRef<number>(0);

  const SWIPE_THRESHOLD = 80;
  const VELOCITY_THRESHOLD = 60; // Lower distance required with velocity
  const VELOCITY_MIN = 0.20; // px/ms
  const MAX_SWIPE = 120;

  const handlers = useSwipeable({
    onSwipeStart: () => {
      swipeStartTime.current = Date.now();
      swipeStartX.current = 0;
    },
    onSwiping: (eventData) => {
      if (isDesktop || isPendingDelete) return; // Disable swipe on desktop or pending delete
      
      const deltaX = eventData.deltaX;
      const direction = deltaX > 0 ? 'right' : 'left';
      
      // Clamp swipe offset
      const clampedOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setSwipeOffset(clampedOffset);
      setSwipeDirection(direction);
      
      // Trigger haptic at threshold
      if (Math.abs(clampedOffset) >= SWIPE_THRESHOLD && !actionTriggered.current) {
        haptic('light');
        actionTriggered.current = true;
      }
    },
    onSwiped: (eventData) => {
      if (isDesktop || isPendingDelete) return;
      
      const deltaX = eventData.deltaX;
      const duration = Date.now() - swipeStartTime.current;
      const velocity = duration > 0 ? Math.abs(deltaX) / duration : 0; // px/ms
      
      // Calculate distance and velocity
      const distance = Math.abs(deltaX);
      const velocityPxS = velocity * 1000; // Convert to px/s for analytics
      
      // Track swipe analytics
      echoHistoryAnalytics.swipeAction({
        thread_id: historyRowProps.id,
        direction: deltaX > 0 ? 'right' : 'left',
        distance_px: distance,
        velocity_px_s: velocityPxS,
      });
      
      // Trigger action if threshold met (distance OR velocity)
      const thresholdMet = distance >= SWIPE_THRESHOLD || 
        (velocity >= VELOCITY_MIN && distance >= VELOCITY_THRESHOLD);
      
      if (thresholdMet) {
        if (deltaX > 0) {
          // Right swipe - Star/Unstar
          haptic('medium');
          onStar();
        } else {
          // Left swipe - Delete
          haptic('medium');
          onDelete();
        }
      }
      
      // Reset
      setSwipeOffset(0);
      setSwipeDirection(null);
      actionTriggered.current = false;
    },
    trackMouse: false,
    trackTouch: true,
  });

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('light');
    echoHistoryAnalytics.starToggled({
      thread_id: historyRowProps.id,
      prev_starred: isStarred,
      next_starred: !isStarred,
      source: 'row-hover',
      list_filters: listFilters,
      rank_index: rankIndex,
    });
    onStar();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('medium');
    onDelete();
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden group"
      style={{ 
        touchAction: 'pan-y',
        opacity: isPendingDelete ? 0.4 : 1,
        pointerEvents: isPendingDelete ? 'none' : 'auto',
        transition: 'opacity 200ms ease-out',
      }}
    >
      {/* Action pills visible during swipe */}
      {swipeDirection === 'right' && swipeOffset > 20 && (
        <div 
          className="absolute left-0 top-0 bottom-0 flex items-center justify-start pl-4"
          style={{
            width: `${Math.min(swipeOffset, MAX_SWIPE)}px`,
            transition: 'opacity 160ms ease-out',
            opacity: Math.min(swipeOffset / SWIPE_THRESHOLD, 1),
          }}
        >
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.10)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            }}
          >
            <Star 
              size={16} 
              style={{ color: 'rgba(255, 255, 255, 0.90)' }}
              fill={isStarred ? 'rgba(255, 255, 255, 0.90)' : 'none'}
            />
            <span 
              className="text-sm font-medium whitespace-nowrap"
              style={{ color: 'rgba(255, 255, 255, 0.90)' }}
            >
              {isStarred ? 'Unstar' : 'Star'}
            </span>
          </div>
        </div>
      )}

      {swipeDirection === 'left' && swipeOffset < -20 && (
        <div 
          className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4"
          style={{
            width: `${Math.min(Math.abs(swipeOffset), MAX_SWIPE)}px`,
            transition: 'opacity 160ms ease-out',
            opacity: Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1),
          }}
        >
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              background: 'rgba(255, 59, 48, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
            }}
          >
            <Trash2 
              size={16} 
              style={{ color: 'rgba(255, 255, 255, 0.92)' }}
            />
            <span 
              className="text-sm font-medium whitespace-nowrap"
              style={{ color: 'rgba(255, 255, 255, 0.92)' }}
            >
              Delete
            </span>
          </div>
        </div>
      )}

      {/* Main row content */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      >
        <div className="relative">
          <HistoryRow {...historyRowProps} onClick={onClick} />
          
          {/* Star indicator on row */}
          {isStarred && (
            <div 
              className="absolute top-3 right-3 pointer-events-none z-10"
              style={{ color: 'var(--hub-text)' }}
            >
              <Star size={14} fill="currentColor" />
            </div>
          )}
          
          {/* Action buttons (desktop hover, mobile always visible) */}
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-200 flex items-center gap-2 ${isDesktop ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            <button
              onClick={handleStarClick}
              className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label={isStarred ? 'Unstar conversation' : 'Star conversation'}
            >
              <Star 
                size={16} 
                style={{ color: 'var(--hub-text)' }}
                fill={isStarred ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-full hover:bg-red-500/20 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Delete conversation"
            >
              <Trash2 
                size={16} 
                style={{ color: 'rgba(255, 59, 48, 0.9)' }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
