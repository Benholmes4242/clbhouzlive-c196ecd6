/**
 * TripTimeline - Timeline view for a trip
 * V2: Supports notes, day markers, stacked sheet navigation
 */

import React from 'react';
import { TripTimelineCard } from './TripTimelineCard';
import type { TripTimelineItem } from '../../hooks/useTripTimeline';
import { Loader2 } from 'lucide-react';

interface TripTimelineProps {
  items: TripTimelineItem[];
  isLoading?: boolean;
  onGameTap?: (gameId: string) => void;
}

export function TripTimeline({ items, isLoading, onGameTap }: TripTimelineProps) {
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
          <span className="text-2xl">⛳</span>
        </div>
        <h3 className="font-medium text-foreground mb-1">No games yet</h3>
        <p className="text-sm text-muted-foreground">
          Games added to this trip will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical spine line */}
      <div 
        className="absolute left-[17px] top-6 bottom-6 w-px bg-border/30"
        aria-hidden="true"
      />

      {/* Timeline items */}
      <div className="space-y-1">
        {items.map(item => (
          <TripTimelineCard
            key={item.id}
            item={item}
            onTap={item.gameId && onGameTap ? () => onGameTap(item.gameId!) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
