/**
 * ScheduleTab - Premium Editorial Schedule Experience
 * 
 * Features:
 * - Full-width immersive hero
 * - Major Championships with gravitas styling
 * - Ryder Cup / Olympics with chapter dividers
 * - Season progress timeline (past/current/future months)
 * - Timeline layout grouped by month
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';

// Import schedule components
import {
  ScheduleHeroCard,
  getFeaturedTournament,
  ScheduleFilterPills,
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
  isMajor,
  isGlobalChapter,
  ScheduleChapterDivider,
  getChapterText,
} from '../schedule';

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: TourTournament[];
  timelineStatus: 'past' | 'current' | 'future';
}

// Determine timeline status for a month
function getMonthTimelineStatus(monthKey: string): 'past' | 'current' | 'future' {
  const now = new Date();
  const currentMonthKey = format(now, 'yyyy-MM');
  
  if (monthKey < currentMonthKey) return 'past';
  if (monthKey === currentMonthKey) return 'current';
  return 'future';
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

  // Group by month for timeline layout with timeline status
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
        timelineStatus: getMonthTimelineStatus(monthKey),
      }));
  }, [filteredResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-[340px] bg-muted -mx-4 sm:-mx-6 lg:-mx-8" />
        <div className="h-12 bg-muted rounded-xl w-full max-w-md" />
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="space-y-4">
                <div className="h-[140px] bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          The Season Schedule
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          The full journey of the season — past, live, and still to come.
        </p>
      </div>

      {/* Featured Hero */}
      {featured && !search && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-8">
          <ScheduleHeroCard 
            tournament={featured.tournament} 
            type={featured.type}
          />
        </div>
      )}
      
      {/* Main content */}
      <div className="space-y-5">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Find an event, venue, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 bg-muted/40 border-0 focus:ring-2 focus:ring-primary/20 rounded-xl placeholder:text-muted-foreground/50"
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
        
        {/* Result Count */}
        <p className="text-xs text-muted-foreground/50">
          {filteredResults.length} event{filteredResults.length !== 1 ? 's' : ''}
          {search && tournaments && filteredResults.length !== tournaments.length && ' matching'}
        </p>
        
        {/* Timeline Layout */}
        {monthGroups.length > 0 ? (
          <div className="space-y-0 relative">
            {/* Subtle vertical timeline line */}
            <div 
              className="absolute left-[5px] top-16 bottom-16 w-px"
              style={{
                background: 'linear-gradient(to bottom, transparent, hsl(var(--border)) 5%, hsl(var(--border)) 95%, transparent)'
              }}
            />
            
            {monthGroups.map((group) => {
              // Track if we've shown a chapter divider
              let shownChapterDivider = false;
              
              return (
                <div key={group.monthKey}>
                  {/* Month Header with timeline status */}
                  <ScheduleMonthHeader 
                    monthLabel={group.monthLabel}
                    eventCount={group.tournaments.length}
                    timelineStatus={group.timelineStatus}
                  />

                  {/* Tournaments */}
                  <div className={cn(
                    "pl-5 border-l ml-[5px] space-y-3",
                    group.timelineStatus === 'past' ? "border-border/20" : "border-border/30"
                  )}>
                    {group.tournaments.map((tournament, idx) => {
                      const major = isMajor(tournament.name);
                      const global = isGlobalChapter(tournament.name);
                      const chapterText = global ? getChapterText(tournament.name) : null;
                      const showChapter = global && chapterText && !shownChapterDivider;
                      
                      if (showChapter) {
                        shownChapterDivider = true;
                      }
                      
                      return (
                        <div 
                          key={tournament.id}
                          className={cn(
                            // Extra spacing for majors and global events
                            major && 'pt-4 pb-4',
                            global && 'pt-2 pb-2',
                            idx === group.tournaments.length - 1 && 'pb-2'
                          )}
                        >
                          {/* Chapter divider for global events */}
                          {showChapter && (
                            <ScheduleChapterDivider 
                              title={chapterText.title}
                              subtitle={chapterText.subtitle}
                            />
                          )}
                          
                          <ScheduleTournamentCard tournament={tournament} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* Bottom fade buffer */}
            <div className="h-20 relative">
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))'
                }}
              />
            </div>
          </div>
        ) : (
          <ScheduleEmptyMessage variant="no-results" />
        )}

        {/* Season Complete Message */}
        {filterStats.upcoming === 0 && filterStats.live === 0 && filterStats.completed > 0 && filter === 'all' && !search && (
          <div className="pt-8 border-t border-border/50">
            <ScheduleEmptyMessage variant="season-complete" />
          </div>
        )}
      </div>
    </div>
  );
}
