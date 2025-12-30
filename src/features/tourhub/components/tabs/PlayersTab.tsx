import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourPlayers } from '../../hooks/useTourHubData';
import { PlayerCard } from '../PlayerCard';
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
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-full max-w-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
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
          placeholder="Search players, country, college..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
        {search && players && filteredPlayers.length !== players.length && ` (of ${players.length})`}
      </p>
      
      {/* Player Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.slice(0, 50).map((player) => (
          <PlayerCard key={player.id} player={player} />
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
