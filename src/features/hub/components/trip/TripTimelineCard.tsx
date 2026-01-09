/**
 * TripTimelineCard - Individual timeline item card
 * V2+: Tour-grade with position badges, visual rhythm, tour director notes
 */

import React from 'react';
import { Clock, StickyNote } from 'lucide-react';
import type { TripTimelineItem } from '../../hooks/useTripTimeline';
import { GameRsvpSummary } from '../rsvp/GameRsvpSummary';
import { TourDayHeader } from './TourDayHeader';

interface TripTimelineCardProps {
  item: TripTimelineItem;
  onTap?: () => void;
}

// Game position badge labels
const POSITION_BADGES: Record<string, string> = {
  first: 'FIRST TEE',
  last: 'FINAL ROUND',
  only: 'MAIN ROUND',
};

export function TripTimelineCard({ item, onTap }: TripTimelineCardProps) {
  // V2+ Day Marker - Tour Day Header
  if (item.type === 'day_marker') {
    return (
      <TourDayHeader
        title={item.title}
        gamesCount={item.dayAggregate?.gamesCount}
        notesCount={item.dayAggregate?.notesCount}
        country={item.dayAggregate?.country}
      />
    );
  }

  // Note item - Tour Director voice
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
        {/* Timeline dot - hollow ring for notes */}
        <div className="flex flex-col items-center pt-0.5">
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'transparent',
              border: '2px solid rgba(251, 191, 36, 0.5)',
            }}
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>

        {/* Content - Tour Director voice */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Tour note
          </span>
          <p className="text-[14px] text-foreground line-clamp-2 mt-0.5">
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

  // Game item - Tee Time Card with position badge
  const showRsvp = item.rsvpCounts !== undefined || item.userRsvp !== undefined;
  const positionBadge = item.gamePosition ? POSITION_BADGES[item.gamePosition] : null;

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
      {/* Timeline dot - solid for games, larger if first of day */}
      <div className="flex flex-col items-center pt-1">
        <div 
          className={`rounded-full bg-primary ${item.isFirstOfDay ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}`}
          style={item.isFirstOfDay ? { 
            boxShadow: '0 0 0 3px rgba(var(--primary), 0.15)' 
          } : undefined}
        />
        {!item.isLastOfDay && (
          <div 
            className="flex-1 w-px mt-2"
            style={{
              background: item.isLastOfDay 
                ? 'linear-gradient(to bottom, hsl(var(--border) / 0.5), transparent)'
                : 'hsl(var(--border) / 0.5)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Course thumbnail */}
        {item.courseThumbnail && (
          <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2 bg-muted">
            <img
              src={item.courseThumbnail}
              alt={item.courseName}
              className="w-full h-full object-cover"
            />
            {/* Position badge overlay */}
            {positionBadge && (
              <div 
                className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  color: 'hsl(var(--foreground))',
                }}
              >
                {positionBadge}
              </div>
            )}
          </div>
        )}

        {/* Title row with badge if no thumbnail */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-foreground truncate">
            {item.title}
          </h4>
          {!item.courseThumbnail && positionBadge && (
            <span 
              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium"
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              {positionBadge}
            </span>
          )}
        </div>

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
