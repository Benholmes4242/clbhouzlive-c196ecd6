/**
 * ScheduleTab - Premium Editorial Schedule Experience (Card-Free)
 * 
 * Features:
 * - Full-width immersive hero
 * - Clean filter pills on page background
 * - Editorial tournament list (no cards)
 * - Timeline layout grouped by month
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

// Import new schedule components
import {
  ScheduleHeroCard,
  getFeaturedTournament,
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
  
  // Get featured tournament for hero
  const featured = useMemo(() => {
    if (!tournaments) return null;
    return getFeaturedTournament(tournaments);
  }, [tournaments]);

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

  // Filter tournaments (excluding featured from the list to avoid duplication)
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

  // Group by month for timeline layout
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
        monthLabel: format(new Date(tournaments[0].start_date), 'MMMM yyyy'),
        tournaments,
      }));
  }, [filteredResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Hero skeleton */}
        <div className="h-[300px] bg-muted rounded-2xl -mx-4 sm:-mx-6" />
        
        {/* Filters skeleton */}
        <div className="h-12 bg-muted rounded-xl w-full max-w-md" />
        
        {/* Timeline skeleton */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-[140px] h-[100px] bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
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
    <div className="space-y-6">
      {/* Featured Hero - Full Width */}
      {featured && filter === 'all' && !search && (
        <ScheduleHeroCard 
          tournament={featured.tournament} 
          type={featured.type}
        />
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tournaments, venues, or cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background border-border focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Filter Tabs */}
      <ScheduleFilterPills
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={filterStats}
      />

      {/* No Live Message (if filtering by Live and none exist) */}
      {filter === 'live' && filterStats.live === 0 && (
        <ScheduleEmptyMessage 
          variant="no-live" 
          nextTournamentName={nextUpcomingName}
        />
      )}
      
      {/* Result Count - subtle */}
      <p className="text-xs text-muted-foreground/60">
        Showing {filteredResults.length} tournament{filteredResults.length !== 1 ? 's' : ''}
        {search && tournaments && filteredResults.length !== tournaments.length && ' (filtered)'}
      </p>
      
      {/* Timeline Layout - Grouped by Month */}
      {monthGroups.length > 0 ? (
        <div className="space-y-0">
          {monthGroups.map((group) => (
            <div key={group.monthKey}>
              {/* Month Header */}
              <ScheduleMonthHeader 
                monthLabel={group.monthLabel}
                eventCount={group.tournaments.length}
              />

              {/* Tournaments - Full-bleed right side only */}
              <div className="pl-5 border-l border-border/40 ml-[5px] space-y-4 mt-4">
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
        <div className="pt-8 border-t border-border">
          <ScheduleEmptyMessage variant="season-complete" />
        </div>
      )}
    </div>
  );
}
