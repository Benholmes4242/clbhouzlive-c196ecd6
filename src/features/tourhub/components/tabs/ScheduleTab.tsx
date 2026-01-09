import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourSeason, useTourTournaments } from '../../hooks/useTourHubData';
import { TournamentCard } from '../TournamentCard';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'upcoming' | 'completed' | 'live';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: typeof filteredTournaments;
}

let filteredTournaments: any[];

export function ScheduleTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);
  
  // Filter tournaments
  const filteredResults = useMemo(() => {
    if (!tournaments) return [];
    
    let filtered = [...tournaments];
    
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(t => t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now));
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

    const groups = new Map<string, typeof filteredResults>();
    
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

  // Stats for current filter
  const filterStats = useMemo(() => {
    if (!tournaments) return { live: 0, upcoming: 0, completed: 0 };
    
    const now = new Date();
    return {
      live: tournaments.filter(t => t.status === 'inprogress').length,
      upcoming: tournaments.filter(t => t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)).length,
      completed: tournaments.filter(t => t.status === 'closed').length,
    };
  }, [tournaments]);
  
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-full max-w-md" />
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-36 bg-muted rounded-xl" />
                <div className="h-36 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments, venues, cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          {filterOptions.map((opt) => {
            const count = opt.value === 'live' ? filterStats.live 
              : opt.value === 'upcoming' ? filterStats.upcoming 
              : opt.value === 'completed' ? filterStats.completed 
              : tournaments.length;
            
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5",
                  filter === opt.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {opt.label}
                {opt.value !== 'all' && count > 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    filter === opt.value ? 'bg-primary-foreground/20' : 'bg-background'
                  )}>
                    {count}
                  </span>
                )}
                {opt.value === 'live' && filterStats.live > 0 && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredResults.length} tournament{filteredResults.length !== 1 ? 's' : ''}
        {search && tournaments && filteredResults.length !== tournaments.length && ' (filtered)'}
      </p>
      
      {/* Timeline Layout - Grouped by Month */}
      <div className="space-y-8">
        {monthGroups.map((group) => (
          <div key={group.monthKey} className="relative">
            {/* Month Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary/30 ring-4 ring-background" />
                <h3 className="text-lg font-semibold text-foreground">{group.monthLabel}</h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">{group.tournaments.length} events</span>
              </div>
            </div>

            {/* Tournaments Grid with Timeline */}
            <div className="relative pl-6 border-l-2 border-border/50 ml-1.5 space-y-4">
              {group.tournaments.map((tournament, idx) => (
                <div key={tournament.id} className="relative">
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute -left-[1.875rem] top-5 w-2.5 h-2.5 rounded-full ring-4 ring-background",
                    tournament.status === 'inprogress' ? 'bg-green-500' :
                    tournament.status === 'closed' ? 'bg-muted-foreground' :
                    'bg-primary'
                  )} />
                  
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {filteredResults.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No tournaments match your search.
        </div>
      )}
    </div>
  );
}
