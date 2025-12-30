import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourSeason, useTourTournaments } from '../../hooks/useTourHubData';
import { TournamentCard } from '../TournamentCard';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'upcoming' | 'completed' | 'live';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

export function ScheduleTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);
  
  const filteredTournaments = useMemo(() => {
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
  
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div className="space-y-4">
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
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                filter === opt.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''}
        {search && tournaments && filteredTournaments.length !== tournaments.length && ' (filtered)'}
      </p>
      
      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
      
      {filteredTournaments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No tournaments match your search.
        </div>
      )}
    </div>
  );
}
