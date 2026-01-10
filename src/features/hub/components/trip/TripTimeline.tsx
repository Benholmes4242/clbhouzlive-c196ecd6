/**
 * TripTimeline - Timeline view for a trip
 * V2+: Tour-grade with sticky today, end-of-day dividers, visual rhythm
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TripTimelineCard } from './TripTimelineCard';
import { StickyTodayPill } from './StickyTodayPill';
import { EndOfDayDivider } from './EndOfDayDivider';
import type { TripTimelineItem } from '../../hooks/useTripTimeline';
import { Loader2, Flag } from 'lucide-react';

interface TripTimelineProps {
  items: TripTimelineItem[];
  isLoading?: boolean;
  onGameTap?: (gameId: string) => void;
  onAddRound?: () => void;
  todayDayNumber?: number;
  hasMultipleDays?: boolean;
  hasTodayInTrip?: boolean;
}

export function TripTimeline({ 
  items, 
  isLoading, 
  onGameTap,
  onAddRound,
  todayDayNumber,
  hasMultipleDays,
  hasTodayInTrip,
}: TripTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const todaySectionRef = useRef<HTMLDivElement>(null);
  const [showTodayPill, setShowTodayPill] = useState(false);

  // Track scroll position to show/hide Today pill
  // Bind to containerRef or window, depending on what's scrolling
  useEffect(() => {
    if (!hasMultipleDays || !hasTodayInTrip) {
      setShowTodayPill(false);
      return;
    }

    const checkVisibility = () => {
      if (!todaySectionRef.current) {
        setShowTodayPill(false);
        return;
      }

      const rect = todaySectionRef.current.getBoundingClientRect();
      // Show pill if today section is not visible in viewport
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      setShowTodayPill(!isVisible);
    };

    // Determine scroll container: use containerRef's scrollable parent or window
    const getScrollParent = (element: HTMLElement | null): HTMLElement | Window => {
      if (!element) return window;
      
      let parent = element.parentElement;
      while (parent) {
        const overflow = getComputedStyle(parent).overflow;
        if (overflow.includes('scroll') || overflow.includes('auto')) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return window;
    };

    const scrollContainer = getScrollParent(containerRef.current);
    
    scrollContainer.addEventListener('scroll', checkVisibility, { passive: true });
    // Initial check
    checkVisibility();

    return () => scrollContainer.removeEventListener('scroll', checkVisibility);
  }, [hasMultipleDays, hasTodayInTrip]);

  // Scroll to today section
  const scrollToToday = useCallback(() => {
    todaySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        >
          <Flag className="w-6 h-6" style={{ color: 'rgba(100, 116, 139, 0.6)' }} />
        </div>
        <h3 
          className="text-[15px] font-semibold mb-1"
          style={{ color: '#1e293b' }}
        >
          No rounds scheduled yet
        </h3>
        <p 
          className="text-[13px] mb-5"
          style={{ color: 'rgba(100, 116, 139, 0.7)' }}
        >
          Add rounds to build your tour itinerary
        </p>
        {onAddRound && (
          <button
            onClick={onAddRound}
            className="px-4 py-2 text-[13px] font-semibold rounded-full transition-all active:scale-[0.97]"
            style={{
              background: '#1e293b',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            }}
          >
            Add a round
          </button>
        )}
      </div>
    );
  }

  // Group items by day for rendering with dividers
  const dayGroups: { dayKey: string; items: TripTimelineItem[]; isToday: boolean }[] = [];
  let currentDayKey: string | null = null;
  let currentGroup: TripTimelineItem[] = [];

  for (const item of items) {
    if (item.type === 'day_marker') {
      // Start new group
      if (currentGroup.length > 0 && currentDayKey) {
        dayGroups.push({ 
          dayKey: currentDayKey, 
          items: currentGroup,
          isToday: currentGroup[0]?.dayAggregate?.isToday || false,
        });
      }
      currentDayKey = item.dayKey || item.id;
      currentGroup = [item];
    } else {
      currentGroup.push(item);
    }
  }
  
  // Push last group
  if (currentGroup.length > 0 && currentDayKey) {
    dayGroups.push({ 
      dayKey: currentDayKey, 
      items: currentGroup,
      isToday: currentGroup[0]?.dayAggregate?.isToday || false,
    });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Timeline content grouped by day */}
      {dayGroups.map((group, groupIdx) => (
        <div 
          key={group.dayKey}
          ref={group.isToday ? todaySectionRef : undefined}
        >
          {/* Day items */}
          <div className="space-y-1.5">
            {group.items.map(item => (
              <TripTimelineCard
                key={item.id}
                item={item}
                onTap={item.gameId && onGameTap ? () => onGameTap(item.gameId!) : undefined}
              />
            ))}
          </div>

          {/* End-of-day divider (not for last day) */}
          {groupIdx < dayGroups.length - 1 && <EndOfDayDivider />}
        </div>
      ))}

      {/* Sticky Today pill */}
      <StickyTodayPill
        visible={showTodayPill}
        dayNumber={todayDayNumber}
        onClick={scrollToToday}
      />
    </div>
  );
}
