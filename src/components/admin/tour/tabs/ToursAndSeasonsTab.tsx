import React from 'react';
import { Layers, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { SyncCard } from '../SyncCard';

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface ToursAndSeasonsTabProps {
  seasons: any[] | undefined;
  counts: Record<string, number> | undefined;
  syncLogs: SyncLog[] | undefined;
  selectedTournament: any | null;
  onSync: (action: string, tournamentId?: string) => void;
  syncing: string | null;
}

export const ToursAndSeasonsTab: React.FC<ToursAndSeasonsTabProps> = ({
  seasons,
  counts,
  syncLogs,
  selectedTournament,
  onSync,
  syncing,
}) => {
  const getLatestSync = (action: string) => syncLogs?.find(log => log.sync_type === action);

  return (
    <div className="space-y-6">
      {/* Seasons */}
      <SyncCard
        title="Seasons"
        description="All available seasons per tour (PGA, LIV, DP World, etc.)"
        icon={<Layers className="h-4 w-4" />}
        action="seasons"
        latestSync={getLatestSync('seasons')}
        recordsCount={counts?.seasons || 0}
        onSync={() => onSync('seasons')}
        isSyncing={syncing === 'seasons'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {seasons?.map((season) => (
            <div key={season.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="font-medium">{season.name}</div>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                <div>🏌️ {season.tour_name}</div>
                <div>📅 {season.year}</div>
                <div className="text-xs opacity-75">ID: {season.sr_id}</div>
              </div>
            </div>
          ))}
          {(!seasons || seasons.length === 0) && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No seasons synced yet
            </div>
          )}
        </div>
      </SyncCard>

      {/* Tee Times */}
      <SyncCard
        title="Tee Times"
        description="Pairings, starting positions, tee times per round"
        icon={<Clock className="h-4 w-4" />}
        action="tee_times"
        latestSync={getLatestSync('tee_times')}
        recordsCount={counts?.tee_times || 0}
        onSync={() => onSync('tee_times', selectedTournament?.sr_id)}
        isSyncing={syncing === 'tee_times'}
        disabled={!selectedTournament}
        disabledReason="Select a tournament first"
      >
        {selectedTournament ? (
          <div className="p-4 bg-muted/50 rounded">
            <p className="text-sm">Syncing tee times for: <span className="font-medium">{selectedTournament.name}</span></p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select a tournament from the Tournaments tab to sync tee times</p>
          </div>
        )}
      </SyncCard>

      {/* Hole Statistics */}
      <SyncCard
        title="Hole Statistics"
        description="How the field performed on each hole"
        icon={<TrendingUp className="h-4 w-4" />}
        action="hole_stats"
        latestSync={getLatestSync('hole_stats')}
        recordsCount={counts?.hole_stats || 0}
        onSync={() => onSync('hole_stats', selectedTournament?.sr_id)}
        isSyncing={syncing === 'hole_stats'}
        disabled={!selectedTournament}
        disabledReason="Select a tournament first"
      >
        {selectedTournament ? (
          <div className="p-4 bg-muted/50 rounded">
            <p className="text-sm">Syncing hole stats for: <span className="font-medium">{selectedTournament.name}</span></p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select a tournament from the Tournaments tab to sync hole statistics</p>
          </div>
        )}
      </SyncCard>

      {/* Scorecards */}
      <SyncCard
        title="Scorecards"
        description="Hole-by-hole scoring, player info, course info"
        icon={<BarChart3 className="h-4 w-4" />}
        action="scorecards"
        latestSync={getLatestSync('scorecards')}
        recordsCount={counts?.scorecards || 0}
        onSync={() => onSync('scorecards', selectedTournament?.sr_id)}
        isSyncing={syncing === 'scorecards'}
        disabled={!selectedTournament}
        disabledReason="Select a tournament first"
      >
        {selectedTournament ? (
          <div className="p-4 bg-muted/50 rounded">
            <p className="text-sm">Syncing scorecards for: <span className="font-medium">{selectedTournament.name}</span></p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select a tournament from the Tournaments tab to sync scorecards</p>
          </div>
        )}
      </SyncCard>
    </div>
  );
};
