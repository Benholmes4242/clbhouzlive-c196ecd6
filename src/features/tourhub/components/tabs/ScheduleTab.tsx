/**
 * ScheduleTab - Redesigned Premium Schedule Experience
 * 
 * Features:
 * - Featured hero card (Live > Upcoming > Recent)
 * - Tab-style filters matching Discover page
 * - Timeline layout grouped by month
 * - Refined tournament cards with visual polish
 * - Smart empty states
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
  getTournamentDotStatus,
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
        <div className="h-56 bg-muted rounded-2xl" />
        
        {/* Filters skeleton */}
        <div className="h-12 bg-muted rounded-xl w-full max-w-md" />
        
        {/* Timeline skeleton */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="space-y-3">
                <div className="h-36 bg-muted rounded-xl" />
                <div className="h-36 bg-muted rounded-xl" />
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
    <div className="space-y-5">
      {/* Featured Hero Card */}
      {featured && filter === 'all' && !search && (
        <div className="mb-6">
          <ScheduleHeroCard 
            tournament={featured.tournament} 
            type={featured.type}
          />
        </div>
      )}

      {/* Search Bar - reduced gap above, increased below */}
      <div className="relative max-w-md pt-1 pb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tournaments, venues, or cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background/80 backdrop-blur-sm border-border/60"
        />
      </div>

      {/* Filter Tabs - Discover style */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-1 px-1">
        <ScheduleFilterPills
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={filterStats}
        />
      </div>

      {/* No Live Message (if filtering by Live and none exist) */}
      {filter === 'live' && filterStats.live === 0 && (
        <ScheduleEmptyMessage 
          variant="no-live" 
          nextTournamentName={nextUpcomingName}
        />
      )}
      
      {/* Result Count */}
      <p className="text-sm text-muted-foreground">
        {filteredResults.length} tournament{filteredResults.length !== 1 ? 's' : ''}
        {search && tournaments && filteredResults.length !== tournaments.length && ' (filtered)'}
      </p>
      
      {/* Timeline Layout - Grouped by Month */}
      {monthGroups.length > 0 ? (
        <div className="space-y-8">
          {monthGroups.map((group) => (
            <div key={group.monthKey} className="relative">
              {/* Month Header */}
              <ScheduleMonthHeader 
                monthLabel={group.monthLabel}
                eventCount={group.tournaments.length}
              />

              {/* Tournaments Grid with Timeline */}
              <div className="relative pl-6 border-l border-border/30 ml-[5px] space-y-4">
                {group.tournaments.map((tournament) => {
                  const dotStatus = getTournamentDotStatus(tournament.status);
                  
                  return (
                    <div key={tournament.id} className="relative">
                      {/* Timeline Dot - aligned with month header dot */}
                      <div className={cn(
                        "absolute -left-[1.625rem] top-5 w-2 h-2 rounded-full ring-4 ring-background",
                        dotStatus === 'live' ? 'bg-emerald-500' :
                        dotStatus === 'completed' ? 'bg-muted-foreground/30' :
                        'bg-transparent border-[1.5px] border-primary/60'
                      )}>
                        {dotStatus === 'live' && (
                          <span 
                            className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500/40"
                            style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                          />
                        )}
                      </div>
                      
                      <ScheduleTournamentCard tournament={tournament} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ScheduleEmptyMessage variant="no-results" />
      )}

      {/* Season Complete Message (if all completed and no upcoming) */}
      {filterStats.upcoming === 0 && filterStats.live === 0 && filterStats.completed > 0 && filter === 'all' && !search && (
        <div className="pt-8 border-t border-border">
          <ScheduleEmptyMessage variant="season-complete" />
        </div>
      )}
    </div>
  );
}
