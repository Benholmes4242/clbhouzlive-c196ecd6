/**
 * ScheduleTab - Cinematic Editorial Schedule Experience
 * 
 * Features:
 * - Full-width immersive event cards (no timeline)
 * - Clean month headers with Clubhouse typography
 * - Premium card-dominant design inspired by LIV Golf
 * - No orange accents - slate/black only
 */

import { useState, useMemo } from 'react';
import { Search, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter } from 'date-fns';

// Import new schedule components
import {
  ScheduleFilterPills,
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
} from '../schedule';

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: TourTournament[];
}

export function ScheduleTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ScheduleFilterType>('all');
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);

  // Filter stats for pills
  const filterStats = useMemo(() => {
    if (!tournaments) return { all: 0, live: 0, upcoming: 0, completed: 0 };
    
    const now = new Date();
    return {
      all: tournaments.length,
      live: tournaments.filter(t => t.status === 'inprogress').length,
      upcoming: tournaments.filter(t => 
        t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)
      ).length,
      completed: tournaments.filter(t => t.status === 'closed').length,
    };
  }, [tournaments]);

  // Get next upcoming tournament name for empty state
  const nextUpcomingName = useMemo(() => {
    if (!tournaments) return undefined;
    const upcoming = tournaments
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return upcoming[0]?.name;
  }, [tournaments]);

  // Filter tournaments
  const filteredResults = useMemo(() => {
    if (!tournaments) return [];
    
    let filtered = [...tournaments];
    
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(t => 
          t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)
        );
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'closed');
        break;
      case 'live':
        filtered = filtered.filter(t => t.status === 'inprogress');
        break;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.venue_name?.toLowerCase().includes(searchLower) ||
        t.venue_city?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [tournaments, filter, search]);

  // Group by month
  const monthGroups = useMemo((): MonthGroup[] => {
    if (!filteredResults.length) return [];

    const groups = new Map<string, TourTournament[]>();
    
    filteredResults.forEach(tournament => {
      const date = new Date(tournament.start_date);
      const monthKey = format(date, 'yyyy-MM');
      const existing = groups.get(monthKey) || [];
      groups.set(monthKey, [...existing, tournament]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, tournaments]) => ({
        monthKey,
        monthLabel: format(new Date(tournaments[0].start_date), 'MMMM yyyy').toUpperCase(),
        tournaments,
      }));
  }, [filteredResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="h-10 w-48 bg-muted rounded-lg mx-auto" />
        
        {/* Search skeleton */}
        <div className="h-11 bg-muted rounded-lg w-full max-w-md" />
        
        {/* Filters skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-24 bg-muted rounded-lg" />
          ))}
        </div>
        
        {/* Cards skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[220px] bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state - no tournaments at all
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div className="min-h-screen pb-24">
      {/* Page Header - Clubhouse style */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-league-spartan text-2xl font-bold text-black tracking-tight">
          Event Schedule
        </h1>
        <button 
          className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          aria-label="Grid view"
        >
          <LayoutGrid className="w-5 h-5 text-black" />
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tournaments, venues, or cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background border-border focus:ring-2 focus:ring-black/10"
        />
      </div>

      {/* Filter Tabs */}
      <ScheduleFilterPills
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={filterStats}
      />

      {/* No Live Message */}
      {filter === 'live' && filterStats.live === 0 && (
        <ScheduleEmptyMessage 
          variant="no-live" 
          nextTournamentName={nextUpcomingName}
        />
      )}
      
      {/* Event Cards - Grouped by Month */}
      {monthGroups.length > 0 ? (
        <div className="space-y-8 mt-6">
          {monthGroups.map((group) => (
            <div key={group.monthKey}>
              {/* Month Header */}
              <ScheduleMonthHeader 
                monthLabel={group.monthLabel}
                eventCount={group.tournaments.length}
              />

              {/* Tournament Cards - Full width with spacing */}
              <div className="space-y-4 mt-4">
                {group.tournaments.map((tournament) => (
                  <ScheduleTournamentCard 
                    key={tournament.id}
                    tournament={tournament}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ScheduleEmptyMessage variant="no-results" />
      )}

      {/* Season Complete Message */}
      {filterStats.upcoming === 0 && filterStats.live === 0 && filterStats.completed > 0 && filter === 'all' && !search && (
        <div className="pt-8 border-t border-border mt-8">
          <ScheduleEmptyMessage variant="season-complete" />
        </div>
      )}
    </div>
  );
}
