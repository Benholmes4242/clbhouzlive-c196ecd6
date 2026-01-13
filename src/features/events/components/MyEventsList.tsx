import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ChevronRight, Plus } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useUserEvents } from '@/features/events/hooks/useEvent';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  onCreateEvent?: () => void;
  limit?: number;
  showViewAll?: boolean;
}

export function MyEventsList({ onCreateEvent, limit, showViewAll = true }: Props) {
  const navigate = useNavigate();
  const { data: events, isLoading } = useUserEvents();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="w-full h-20 rounded-xl" />
        <Skeleton className="w-full h-20 rounded-xl" />
      </div>
    );
  }

  const displayEvents = limit ? events?.slice(0, limit) : events;
  const hasMore = limit && events && events.length > limit;

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="font-medium">No events yet</p>
        <p className="text-sm text-muted-foreground">Create or join an event to get started</p>
        {onCreateEvent && (
          <Button onClick={onCreateEvent} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayEvents?.map((event) => {
        const eventDate = new Date(event.start_date);
        const isEventToday = isToday(eventDate);
        const isEventPast = isPast(eventDate) && !isEventToday;

        return (
          <button
            key={event.id}
            onClick={() => navigate(`/events/${event.id}`)}
            className={cn(
              'w-full text-left p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors',
              isEventPast && 'opacity-60'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary uppercase">
                    {isEventToday ? 'Today' : event.event_type === 'society_day' ? 'Society Day' : event.event_type === 'multi_day' ? 'Golf Trip' : 'Event'}
                  </span>
                </div>
                <p className="font-semibold truncate">{event.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(eventDate, 'MMM d')}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </button>
        );
      })}

      {showViewAll && hasMore && (
        <Button onClick={() => navigate('/events')} variant="ghost" className="w-full">
          View all events
        </Button>
      )}
    </div>
  );
}
