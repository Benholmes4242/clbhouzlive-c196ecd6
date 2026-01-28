import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, DollarSign, Trophy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SyncCard } from '../SyncCard';

interface Tournament {
  id: string;
  sr_id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  purse: number | null;
  currency: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  venue_course_name: string | null;
  venue_par: number | null;
  venue_yardage: number | null;
  defending_champion: string | null;
  is_featured: boolean;
  scoring_system?: string | null;
  created_at?: string;
  updated_at?: string;
  event_type?: string | null;
  season_id?: string | null;
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface TournamentsTabProps {
  tournaments: Tournament[] | undefined;
  leaderboards: any[] | undefined;
  counts: Record<string, number> | undefined;
  syncLogs: SyncLog[] | undefined;
  selectedTournament: Tournament | null;
  selectedRound: number;
  onSelectTournament: (tournament: Tournament) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onSync: (action: string, tournamentId?: string) => void;
  syncing: string | null;
  isLoading: boolean;
}

export const TournamentsTab: React.FC<TournamentsTabProps> = ({
  tournaments,
  leaderboards,
  counts,
  syncLogs,
  selectedTournament,
  onSelectTournament,
  onToggleFeatured,
  onSync,
  syncing,
  isLoading,
}) => {
  const getLatestSync = (action: string) => syncLogs?.find(log => log.sync_type === action);

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'inprogress': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'closed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-red-500/20 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Tournament Schedule */}
      <SyncCard
        title="Tournament Schedule"
        description="All tournaments for the season with dates, venues, purses"
        icon={<Calendar className="h-4 w-4" />}
        action="schedule"
        latestSync={getLatestSync('schedule')}
        recordsCount={counts?.tournaments || 0}
        onSync={() => onSync('schedule')}
        isSyncing={syncing === 'schedule'}
      >
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-muted-foreground">Loading tournaments...</div>
          ) : tournaments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tournaments synced yet</p>
            </div>
          ) : (
            tournaments?.map((tournament) => (
              <div 
                key={tournament.id} 
                className={`flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${
                  selectedTournament?.sr_id === tournament.sr_id ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                <Checkbox
                  checked={tournament.is_featured}
                  onCheckedChange={(checked) => onToggleFeatured(tournament.id, !!checked)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground truncate">{tournament.name}</h3>
                    <Badge className={getStatusColor(tournament.status)}>{tournament.status || 'Unknown'}</Badge>
                    {tournament.is_featured && <Badge variant="outline" className="border-primary text-primary">Featured</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {tournament.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseISO(tournament.start_date), 'MMM d')}
                        {tournament.end_date && ` - ${format(parseISO(tournament.end_date), 'MMM d, yyyy')}`}
                      </span>
                    )}
                    {(tournament.venue_city || tournament.venue_state) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {[tournament.venue_city, tournament.venue_state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {tournament.purse && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatCurrency(tournament.purse, tournament.currency)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={selectedTournament?.sr_id === tournament.sr_id ? 'default' : 'outline'}
                  onClick={() => onSelectTournament(tournament)}
                >
                  {selectedTournament?.sr_id === tournament.sr_id ? 'Selected' : 'Select'}
                </Button>
              </div>
            ))
          )}
        </div>
      </SyncCard>

      {/* Tournament Results / Leaderboard */}
      <SyncCard
        title="Tournament Leaderboard"
        description="Real-time positions, player stats per round, live scoring"
        icon={<Trophy className="h-4 w-4" />}
        action="leaderboard"
        latestSync={getLatestSync('leaderboard')}
        recordsCount={counts?.leaderboards || 0}
        onSync={() => onSync('leaderboard', selectedTournament?.sr_id)}
        isSyncing={syncing === 'leaderboard'}
        disabled={!selectedTournament}
        disabledReason="Select a tournament first"
      >
        {selectedTournament ? (
          <div className="space-y-2">
            <div className="mb-3 p-2 bg-muted/50 rounded text-sm">
              Showing leaderboard for: <span className="font-medium">{selectedTournament.name}</span>
            </div>
            {leaderboards?.slice(0, 20).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold w-8">{entry.position_tied ? 'T' : ''}{entry.position}</span>
                  <div>
                    <div className="font-medium">{entry.sr_players?.first_name} {entry.sr_players?.last_name}</div>
                    <div className="text-sm text-muted-foreground">{entry.sr_tournaments?.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{entry.score > 0 ? '+' : ''}{entry.score}</div>
                  <div className="text-sm text-muted-foreground">
                    {[entry.round_1, entry.round_2, entry.round_3, entry.round_4].filter(Boolean).join('-')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select a tournament above to view/sync leaderboard</p>
          </div>
        )}
      </SyncCard>
    </div>
  );
};
