import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, MapPin, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourPlayers } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';

export function PlayersTab() {
  const [search, setSearch] = useState('');
  const { data: players, isLoading } = useTourPlayers();
  
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    if (!search || search.length < 2) return players;
    
    const searchLower = search.toLowerCase();
    return players.filter(p => 
      p.full_name.toLowerCase().includes(searchLower) ||
      p.country?.toLowerCase().includes(searchLower) ||
      p.college?.toLowerCase().includes(searchLower)
    );
  }, [players, search]);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (!players || players.length === 0) {
    return <TourHubEmptyState variant="players" />;
  }
  
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players by name, country, or college..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Player Count */}
      <p className="text-sm text-muted-foreground">
        {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
        {search && players && filteredPlayers.length !== players.length && ` (of ${players.length})`}
      </p>
      
      {/* Player Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.slice(0, 50).map((player) => (
          <Link
            key={player.id}
            to={`/tourhub/player/${player.id}`}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={player.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {player.full_name}
                </h3>
                
                {player.country && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {player.country}
                  </p>
                )}
                
                {player.college && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <GraduationCap className="w-3 h-3 shrink-0" />
                    {player.college}
                  </p>
                )}
                
                {player.turned_pro && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Pro since {player.turned_pro}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredPlayers.length > 50 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Showing first 50 of {filteredPlayers.length} players. Use search to find more.
        </p>
      )}
      
      {filteredPlayers.length === 0 && search && (
        <div className="text-center py-12 text-muted-foreground">
          No players match your search.
        </div>
      )}
    </div>
  );
}
