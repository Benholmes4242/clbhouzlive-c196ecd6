import React, { useMemo, useState } from 'react';
import { mockEvents } from '@/data/tourMock';
import { Event, TourType } from '@/types/tour';

type TimeFilter = 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'FULL_SEASON';

const TOUR_OPTIONS: { id: TourType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Tours' },
  { id: 'PGA', label: 'PGA Tour' },
  { id: 'LIV', label: 'LIV Golf' },
  { id: 'DP_WORLD', label: 'DP World Tour' },
  { id: 'LPGA', label: 'LPGA' },
  { id: 'NCAA_MEN', label: 'NCAA Men' },
  { id: 'NCAA_WOMEN', label: 'NCAA Women' },
];

export function TourEventsView() {
  const [tourFilter, setTourFilter] = useState<TourType | 'ALL'>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('FULL_SEASON');

  const events = useMemo(() => {
    const now = new Date();
    const inXDays = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    };

    let filtered = mockEvents;

    if (tourFilter !== 'ALL') {
      filtered = filtered.filter(e => e.tour === tourFilter);
    }

    if (timeFilter !== 'FULL_SEASON') {
      if (timeFilter === 'THIS_WEEK') {
        const end = inXDays(7);
        filtered = filtered.filter(e => new Date(e.startDate) <= end);
      }
      if (timeFilter === 'NEXT_WEEK') {
        const start = inXDays(7);
        const end = inXDays(14);
        filtered = filtered.filter(e => {
          const d = new Date(e.startDate);
          return d >= start && d <= end;
        });
      }
      if (timeFilter === 'THIS_MONTH') {
        const month = now.getMonth();
        const year = now.getFullYear();
        filtered = filtered.filter(e => {
          const d = new Date(e.startDate);
          return d.getMonth() === month && d.getFullYear() === year;
        });
      }
    }

    return filtered.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [tourFilter, timeFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={tourFilter}
          onChange={e => setTourFilter(e.target.value as TourType | 'ALL')}
          className="flex-1 rounded-sq-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {TOUR_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1 rounded-sq-md border border-border bg-muted/30 p-1 text-[11px]">
          {[
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'NEXT_WEEK', label: 'Next Week' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'FULL_SEASON', label: 'Season' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTimeFilter(opt.id as TimeFilter)}
              className={`rounded-sq-sm px-2 py-1 transition-colors ${
                timeFilter === opt.id 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event cards */}
      <div className="space-y-3">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}

        {events.length === 0 && (
          <div className="rounded-sq-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            No events found for this filter. Try a different time period or tour.
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="rounded-sq-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{event.tour.replace('_', ' ')}</p>
          <h3 className="text-sm font-semibold text-foreground">{event.name}</h3>
          <p className="text-[11px] text-muted-foreground">
            {new Date(event.startDate).toLocaleDateString()} –{' '}
            {new Date(event.endDate).toLocaleDateString()}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {event.courseName} • {event.courseLocation}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            {event.prizePool && (
              <span className="rounded-sq-pill bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                Prize ${(event.prizePool / 1_000_000).toFixed(1)}M
              </span>
            )}
            {event.isMajor && (
              <span className="rounded-sq-pill bg-amber-500/10 px-2 py-0.5 text-amber-600 dark:text-amber-400">
                Major
              </span>
            )}
            <span
              className={`rounded-sq-pill px-2 py-0.5 ${
                event.status === 'LIVE'
                  ? 'bg-destructive/20 text-destructive'
                  : event.status === 'COMPLETED'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {event.status === 'LIVE'
                ? 'Live'
                : event.status === 'COMPLETED'
                ? 'Completed'
                : 'Upcoming'}
            </span>
          </div>
        </div>
        {event.logoUrl && (
          <img
            src={event.logoUrl}
            alt={event.name}
            className="h-10 w-10 flex-shrink-0 rounded-sq-sm bg-muted object-contain"
          />
        )}
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <button className="flex-1 rounded-sq-pill bg-foreground py-1.5 font-medium text-background">
          Add to Calendar
        </button>
        <button className="flex-1 rounded-sq-pill border border-border py-1.5 text-foreground hover:bg-muted/50 transition-colors">
          Set Reminder
        </button>
      </div>
    </div>
  );
}
