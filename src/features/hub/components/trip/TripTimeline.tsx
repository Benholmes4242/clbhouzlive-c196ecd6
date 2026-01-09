/**
 * TripTimeline - Timeline view for a trip
 * V2+: Tour-grade with sticky today, end-of-day dividers, visual rhythm
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TripTimelineCard } from './TripTimelineCard';
import { StickyTodayPill } from './StickyTodayPill';
import { EndOfDayDivider } from './EndOfDayDivider';
import type { TripTimelineItem } from '../../hooks/useTripTimeline';
import { Loader2, Flag, StickyNote } from 'lucide-react';

interface TripTimelineProps {
  items: TripTimelineItem[];
  isLoading?: boolean;
  onGameTap?: (gameId: string) => void;
  todayDayNumber?: number;
  hasMultipleDays?: boolean;
  hasTodayInTrip?: boolean;
}

export function TripTimeline({ 
  items, 
  isLoading, 
  onGameTap,
  todayDayNumber,
  hasMultipleDays,
  hasTodayInTrip,
}: TripTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const todaySectionRef = useRef<HTMLDivElement>(null);
  const [showTodayPill, setShowTodayPill] = useState(false);

  // Track scroll position to show/hide Today pill
  const handleScroll = useCallback(() => {
    if (!hasMultipleDays || !hasTodayInTrip || !todaySectionRef.current) {
      setShowTodayPill(false);
      return;
    }

    const rect = todaySectionRef.current.getBoundingClientRect();
    // Show pill if today section is not visible in viewport
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    setShowTodayPill(!isVisible);
  }, [hasMultipleDays, hasTodayInTrip]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Flag className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">No rounds scheduled yet</h3>
        <p className="text-sm text-muted-foreground">
          Add games to build your tour itinerary
        </p>
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

      {/* Empty day states would be handled per-day if needed */}
      
      {/* Sticky Today pill */}
      <StickyTodayPill
        visible={showTodayPill}
        dayNumber={todayDayNumber}
        onClick={scrollToToday}
      />
    </div>
  );
}
