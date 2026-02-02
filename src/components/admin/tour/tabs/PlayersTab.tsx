import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Crown, BarChart3, Upload, Search, CheckCircle, RefreshCw, User } from 'lucide-react';
import { SyncCard } from '../SyncCard';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();
  
  // Headshot upload state
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search for players
  const { data: playerResults, isLoading: playersLoading } = useQuery({
    queryKey: ['player-headshot-search', playerSearch],
    queryFn: async () => {
      if (!playerSearch || playerSearch.length < 2) return [];
      const { data, error } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, full_name, photo_url, pga_tour_id')
        .ilike('full_name', `%${playerSearch}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: playerSearch.length >= 2,
  });

  // Upload mutation
  const uploadHeadshotMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedPlayerId) throw new Error('No player selected');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('playerId', selectedPlayerId);

      const response = await fetch(
        `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/upload-player-headshot`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Headshot uploaded successfully!`, {
        description: `Photo URL: ${data.publicUrl}`,
      });
      setSelectedPlayerId('');
      setPlayerSearch('');
      setUploadPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['player-headshot-search'] });
      queryClient.invalidateQueries({ queryKey: ['sr-players'] });
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!selectedPlayerId) {
      toast.error('Please select a player');
      return;
    }
    uploadHeadshotMutation.mutate(file);
  };

  return (
    <div className="space-y-6">
      {/* Upload Player Headshot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Player Headshot
          </CardTitle>
          <CardDescription>
            Upload a custom headshot for a player. This will be stored in R2 and used across the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Search */}
            <div className="space-y-2">
              <Label htmlFor="player-search">Search Player</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="player-search"
                  placeholder="Search by player name..."
                  value={playerSearch}
                  onChange={(e) => {
                    setPlayerSearch(e.target.value);
                    setSelectedPlayerId('');
                  }}
                  className="pl-9"
                />
              </div>
              
              {/* Player Results */}
              {playerSearch.length >= 2 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                  {playersLoading ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">Searching...</div>
                  ) : playerResults && playerResults.length > 0 ? (
                    playerResults.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlayerId(player.id);
                          setPlayerSearch(player.full_name);
                        }}
                        className={`w-full flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors text-left ${
                          selectedPlayerId === player.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {player.photo_url ? (
                            <img src={player.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{player.full_name}</div>
                        </div>
                        {selectedPlayerId === player.id && (
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground text-sm">No players found</div>
                  )}
                </div>
              )}
            </div>

            {/* File Upload & Preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headshot-file">Headshot Image</Label>
                <Input
                  ref={fileInputRef}
                  id="headshot-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Preview */}
              {uploadPreview && (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-dashed flex-shrink-0">
                    <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedPlayerId || uploadHeadshotMutation.isPending}
                    size="sm"
                  >
                    {uploadHeadshotMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
