import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter, isBefore } from 'date-fns';
import { Calendar, MapPin, DollarSign, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourSeason, useTourTournaments } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    inprogress: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    created: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    closed: 'bg-muted text-muted-foreground border-border',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${colors[status] || colors.created}`}>
      {status === 'inprogress' ? 'Live' : status}
    </span>
  );
}

type FilterType = 'all' | 'upcoming' | 'completed' | 'live';

export function ScheduleTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);
  
  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    
    let filtered = [...tournaments];
    
    // Apply status filter
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
    
    // Apply search filter
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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'upcoming', 'live', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tournament Count */}
      <p className="text-sm text-muted-foreground">
        {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''}
      </p>
      
      {/* Tournament List */}
      <div className="space-y-3">
        {filteredTournaments.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/tourhub/tournament/${tournament.id}`}
            className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {tournament.name}
                  </h3>
                  <StatusBadge status={tournament.status} />
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
                  </span>
                  
                  {(tournament.venue_name || tournament.venue_city) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(', ')}
                    </span>
                  )}
                  
                  {tournament.purse && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      ${(tournament.purse / 1_000_000).toFixed(1)}M
                    </span>
                  )}
                </div>
              </div>
              
              {tournament.venue_par && tournament.venue_yardage && (
                <div className="text-right text-sm text-muted-foreground">
                  <p>Par {tournament.venue_par}</p>
                  <p>{tournament.venue_yardage.toLocaleString()} yards</p>
                </div>
              )}
            </div>
          </Link>
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
