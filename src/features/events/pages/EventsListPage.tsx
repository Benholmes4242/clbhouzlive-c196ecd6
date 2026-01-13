import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Calendar, Filter } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { useUserEvents } from '@/features/events/hooks/useEvent';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateEventWizard } from '../components/create-event/CreateEventWizard';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'upcoming' | 'past';

export default function EventsListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: events, isLoading } = useUserEvents();

  const filteredEvents = events?.filter(event => {
    const eventDate = new Date(event.start_date);
    if (filter === 'upcoming') return isFuture(eventDate) || format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    if (filter === 'past') return isPast(eventDate) && format(eventDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return filter === 'past' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">My Events</h1>
          </div>
          <Button onClick={() => setWizardOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 pb-3">
          {(['upcoming', 'past', 'all'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium capitalize',
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-24 rounded-xl" />
            <Skeleton className="w-full h-24 rounded-xl" />
            <Skeleton className="w-full h-24 rounded-xl" />
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map(event => (
              <button
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="w-full text-left p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-primary uppercase">
                      {event.event_type === 'society_day' ? 'Society Day' : event.event_type === 'multi_day' ? 'Golf Trip' : event.event_type === 'tournament' ? 'Tournament' : 'Event'}
                    </span>
                    <p className="font-semibold truncate mt-1">{event.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full capitalize',
                    event.status === 'published' ? 'bg-green-100 text-green-700' :
                    event.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {event.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="font-medium">No {filter !== 'all' ? filter : ''} events</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'upcoming' ? 'Create an event or join one via invite link' : 'Your past events will appear here'}
            </p>
            {filter === 'upcoming' && (
              <Button onClick={() => setWizardOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Wizard */}
      {wizardOpen && <CreateEventWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
