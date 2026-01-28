import React from 'react';
import { Users, Crown, BarChart3 } from 'lucide-react';
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

interface PlayersTabProps {
  players: any[] | undefined;
  rankings: any[] | undefined;
  playerStats: any[] | undefined;
  counts: Record<string, number> | undefined;
  syncLogs: SyncLog[] | undefined;
  onSync: (action: string) => void;
  syncing: string | null;
}

export const PlayersTab: React.FC<PlayersTabProps> = ({
  players,
  rankings,
  playerStats,
  counts,
  syncLogs,
  onSync,
  syncing,
}) => {
  const getLatestSync = (action: string) => syncLogs?.find(log => log.sync_type === action);

  return (
    <div className="space-y-6">
      {/* Player Profiles */}
      <SyncCard
        title="Player Profiles"
        description="Height, weight, DOB, residence, college"
        icon={<Users className="h-4 w-4" />}
        action="players"
        latestSync={getLatestSync('players')}
        recordsCount={counts?.players || 0}
        onSync={() => onSync('players')}
        isSyncing={syncing === 'players'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {players?.slice(0, 30).map((player) => (
            <div key={player.id} className="p-3 rounded-lg border border-border bg-card">
              <div className="font-medium">{player.full_name}</div>
              <div className="text-sm text-muted-foreground space-y-1">
                {player.country && <div>🌍 {player.country}</div>}
                {player.residence && <div>📍 {player.residence}</div>}
                {player.college && <div>🎓 {player.college}</div>}
                {player.turned_pro && <div>⛳ Pro since {player.turned_pro}</div>}
              </div>
            </div>
          ))}
          {(!players || players.length === 0) && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No players synced yet
            </div>
          )}
        </div>
      </SyncCard>

      {/* World Rankings */}
      <SyncCard
        title="World Golf Rankings"
        description="Top 200 players with points"
        icon={<Crown className="h-4 w-4" />}
        action="rankings"
        latestSync={getLatestSync('rankings')}
        recordsCount={counts?.rankings || 0}
        onSync={() => onSync('rankings')}
        isSyncing={syncing === 'rankings'}
      >
        <div className="space-y-2">
          {rankings?.slice(0, 30).map((ranking: any) => (
            <div key={ranking.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8">#{ranking.rank}</span>
                <div>
                  <div className="font-medium">
                    {ranking.sr_players?.first_name} {ranking.sr_players?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">{ranking.sr_players?.country_code}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{ranking.points?.toFixed(2)} pts</div>
                {ranking.events_played && <div className="text-sm text-muted-foreground">{ranking.events_played} events</div>}
              </div>
            </div>
          ))}
          {(!rankings || rankings.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">No rankings synced yet</div>
          )}
        </div>
      </SyncCard>

      {/* Player Statistics */}
      <SyncCard
        title="Player Statistics"
        description="Season stats (FedEx Cup points, etc.)"
        icon={<BarChart3 className="h-4 w-4" />}
        action="player_stats"
        latestSync={getLatestSync('player_stats')}
        recordsCount={counts?.player_stats || 0}
        onSync={() => onSync('player_stats')}
        isSyncing={syncing === 'player_stats'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {playerStats?.slice(0, 30).map((stat: any) => (
            <div key={stat.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="font-medium">
                {stat.sr_players?.first_name} {stat.sr_players?.last_name}
              </div>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                {stat.fedex_points && <div>🏆 FedEx: {stat.fedex_points.toLocaleString()} pts</div>}
                {stat.events_played && <div>📅 {stat.events_played} events</div>}
                {stat.scoring_avg && <div>⛳ Avg: {stat.scoring_avg.toFixed(2)}</div>}
                {stat.sr_players?.country_code && <div>🌍 {stat.sr_players.country_code}</div>}
              </div>
            </div>
          ))}
          {(!playerStats || playerStats.length === 0) && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No player statistics synced yet
            </div>
          )}
        </div>
      </SyncCard>
    </div>
  );
};
