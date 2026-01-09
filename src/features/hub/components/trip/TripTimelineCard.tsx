/**
 * TripTimelineCard - Individual timeline item card
 * V2: Upgraded day markers, note type support, consistent RSVP display
 */

import React from 'react';
import { Clock, StickyNote } from 'lucide-react';
import type { TripTimelineItem } from '../../hooks/useTripTimeline';
import { GameRsvpSummary } from '../rsvp/GameRsvpSummary';

interface TripTimelineCardProps {
  item: TripTimelineItem;
  onTap?: () => void;
}

export function TripTimelineCard({ item, onTap }: TripTimelineCardProps) {
  // V2 Day Marker - glass pill style
  if (item.type === 'day_marker') {
    return (
      <div className="flex items-center justify-between py-3 px-1">
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <span className="text-[13px] font-semibold text-foreground">
            {item.title}
          </span>
        </div>
        {item.meta && (
          <span className="text-[12px] text-slate-500 pr-1">
            {item.meta}
          </span>
        )}
      </div>
    );
  }

  // Note item
  if (item.type === 'note') {
    return (
      <div
        className="w-full flex gap-3 p-3 rounded-xl text-left"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Timeline dot - note icon */}
        <div className="flex flex-col items-center pt-0.5">
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-foreground line-clamp-2">
            {item.title}
          </p>
          {item.subtitle && (
            <div className="flex items-center gap-1 mt-1 text-[12px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {item.subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game item - show RSVP if counts exist OR if userRsvp exists
  const showRsvp = item.rsvpCounts !== undefined || item.userRsvp !== undefined;

  return (
    <button
      onClick={onTap}
      className="w-full flex gap-3 p-3 rounded-xl text-left transition-colors"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
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

        {/* Time - spacing 4px from title */}
        {item.subtitle && (
          <div className="flex items-center gap-1 mt-1 text-[12px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {item.subtitle}
          </div>
        )}

        {/* RSVP Summary - spacing 8px from time */}
        {showRsvp && (
          <div className="mt-2">
            <GameRsvpSummary
              variant="compact"
              goingCount={item.rsvpCounts?.going ?? 0}
              maybeCount={item.rsvpCounts?.maybe}
              userRsvp={item.userRsvp ?? null}
            />
          </div>
        )}
      </div>
    </button>
  );
}
