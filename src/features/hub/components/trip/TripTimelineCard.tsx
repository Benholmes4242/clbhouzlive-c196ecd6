/**
 * TripTimelineCard - Individual timeline item card
 * V2.1: Added RSVP summary line for game items
 */

import React from 'react';
import { Clock, Users } from 'lucide-react';
import type { TripTimelineItem } from '../../hooks/useTripTimeline';

interface TripTimelineCardProps {
  item: TripTimelineItem;
  onTap?: () => void;
}

export function TripTimelineCard({ item, onTap }: TripTimelineCardProps) {
  if (item.type === 'day_marker') {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
        <span className="text-sm font-semibold text-foreground">
          {item.title}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onTap}
      className="w-full flex gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors text-left"
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <div className="flex-1 w-px bg-border/50 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Course thumbnail */}
        {item.courseThumbnail && (
          <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-muted">
            <img
              src={item.courseThumbnail}
              alt={item.courseName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h4 className="font-medium text-foreground truncate">
          {item.title}
        </h4>

        {/* Time */}
        {item.subtitle && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {item.subtitle}
          </div>
        )}

        {/* RSVP Summary - compact variant */}
        {item.rsvpCounts && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{item.rsvpCounts.going} going</span>
            {item.rsvpCounts.maybe > 0 && (
              <span className="opacity-70">· {item.rsvpCounts.maybe} maybe</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
