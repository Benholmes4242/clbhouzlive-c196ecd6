import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Globe, Layers, History, Image } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import {
  TourDataHeader,
  TournamentsTab,
  PlayersTab,
  CoursesTab,
  ToursAndSeasonsTab,
  SyncHistoryTab,
} from '@/components/admin/tour';
import MediaAssetsManagement from '@/components/admin/media/MediaAssetsManagement';

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
  created_at?: string;
  updated_at?: string;
  event_type?: string | null;
  scoring_system?: string | null;
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

export function AdminTourPage() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [showSyncAllConfirm, setShowSyncAllConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('tournaments');

  // Fetch all counts
  const { data: counts } = useQuery({
    queryKey: ['sr-counts'],
    queryFn: async () => {
      const [tournaments, seasons, players, rankings, leaderboards, summaries, scorecards, tee_times, hole_stats, player_stats, courses] = await Promise.all([
        supabase.from('sr_tournaments').select('id', { count: 'exact', head: true }),
        supabase.from('sr_seasons').select('id', { count: 'exact', head: true }),
        supabase.from('sr_players').select('id', { count: 'exact', head: true }),
        supabase.from('sr_world_rankings').select('id', { count: 'exact', head: true }),
        supabase.from('sr_leaderboards').select('id', { count: 'exact', head: true }),
        supabase.from('sr_tournament_summaries').select('id', { count: 'exact', head: true }),
        supabase.from('sr_scorecards').select('id', { count: 'exact', head: true }),
        supabase.from('sr_tee_times').select('id', { count: 'exact', head: true }),
        supabase.from('sr_hole_statistics').select('id', { count: 'exact', head: true }),
        supabase.from('sr_player_statistics').select('id', { count: 'exact', head: true }),
        supabase.from('sr_courses').select('id', { count: 'exact', head: true }),
      ]);
      return {
        tournaments: tournaments.count || 0,
        seasons: seasons.count || 0,
        players: players.count || 0,
        rankings: rankings.count || 0,
        leaderboards: leaderboards.count || 0,
        summaries: summaries.count || 0,
        scorecards: scorecards.count || 0,
        tee_times: tee_times.count || 0,
        hole_stats: hole_stats.count || 0,
        player_stats: player_stats.count || 0,
        courses: courses.count || 0,
        media: 0, // sr_media_assets decommissioned — R2 is now sole headshot source
      };
    },
  });

  // Fetch tournaments
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['sr-tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data as Tournament[];
    },
  });

  // Fetch sync logs
  const { data: syncLogs } = useQuery({
    queryKey: ['sr-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SyncLog[];
    },
  });

  // Fetch players
  const { data: players } = useQuery({
    queryKey: ['sr-players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_players')
        .select('*')
        .order('last_name', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch rankings
  const { data: rankings } = useQuery({
    queryKey: ['sr-rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select('*, sr_players(first_name, last_name, country_code)')
        .order('rank', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch leaderboards
  const { data: leaderboards } = useQuery({
    queryKey: ['sr-leaderboards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select('*, sr_players(first_name, last_name), sr_tournaments(name)')
        .order('position', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ['sr-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_courses')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch seasons
  const { data: seasons } = useQuery({
    queryKey: ['sr-seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_seasons')
        .select('*')
        .order('year', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch player statistics
  const { data: playerStats } = useQuery({
    queryKey: ['sr-player-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_player_statistics')
        .select('*, sr_players(first_name, last_name, country_code)')
        .order('fedex_points', { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async ({ 
      action, 
      tournamentId,
      seasonYear,
      roundType,
      roundNumber 
    }: { 
      action: string; 
      tournamentId?: string;
      seasonYear?: number;
      roundType?: string;
      roundNumber?: number;
    }) => {
      setSyncing(action);
      const { data, error } = await supabase.functions.invoke('sportradar-sync', {
        body: { 
          action, 
          tourId: 'pga', 
          year: 2025,
          tournamentId,
          seasonYear: seasonYear || 2025,
          roundType: roundType || 'stroke',
          roundNumber
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sync complete: ${data.message}`);
      if (data.debug) {
        console.log('Sync debug info:', data.debug);
      }
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: ['sr-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['sr-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sr-counts'] });
      queryClient.invalidateQueries({ queryKey: ['sr-players'] });
      queryClient.invalidateQueries({ queryKey: ['sr-rankings'] });
      queryClient.invalidateQueries({ queryKey: ['sr-leaderboards'] });
      queryClient.invalidateQueries({ queryKey: ['sr-courses'] });
      queryClient.invalidateQueries({ queryKey: ['sr-seasons'] });
      queryClient.invalidateQueries({ queryKey: ['sr-player-stats'] });
      setSyncing(null);
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
      setSyncing(null);
    },
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('sr_tournaments')
        .update({ is_featured })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sr-tournaments'] });
      toast.success('Tournament updated');
    },
  });

  const handleSync = (action: string, tournamentId?: string) => {
    const roundType = selectedTournament?.scoring_system || 'stroke';
    syncMutation.mutate({ 
      action, 
      tournamentId,
      seasonYear: 2025,
      roundType,
      roundNumber: selectedRound
    });
  };

  const handleSyncAll = async () => {
    setShowSyncAllConfirm(false);
    const actions = ['schedule', 'seasons', 'players', 'rankings'];
    for (const action of actions) {
      await syncMutation.mutateAsync({ action });
    }
  };

  const latestSync = syncLogs?.[0];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <TourDataHeader
        counts={counts}
        latestSync={latestSync}
        onSyncAll={() => setShowSyncAllConfirm(true)}
        isSyncing={!!syncing}
      />

      {/* Selected Tournament Indicator */}
      {selectedTournament && (
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Selected Tournament: </span>
            <span className="font-medium">{selectedTournament.name}</span>
          </div>
          <button 
            onClick={() => setSelectedTournament(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tournaments" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Tournaments</span>
          </TabsTrigger>
          <TabsTrigger value="players" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Players</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Courses</span>
          </TabsTrigger>
          <TabsTrigger value="tours" className="gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Tours & Seasons</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Sync History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <TournamentsTab
            tournaments={tournaments}
            leaderboards={leaderboards}
            counts={counts}
            syncLogs={syncLogs}
            selectedTournament={selectedTournament}
            selectedRound={selectedRound}
            onSelectTournament={setSelectedTournament}
            onToggleFeatured={(id, featured) => toggleFeaturedMutation.mutate({ id, is_featured: featured })}
            onSync={handleSync}
            syncing={syncing}
            isLoading={tournamentsLoading}
          />
        </TabsContent>

        <TabsContent value="players">
          <PlayersTab
            players={players}
            rankings={rankings}
            playerStats={playerStats}
            counts={counts}
            syncLogs={syncLogs}
            onSync={handleSync}
            syncing={syncing}
          />
        </TabsContent>

        <TabsContent value="courses">
          <CoursesTab
            courses={courses}
            counts={counts}
            syncLogs={syncLogs}
            selectedTournament={selectedTournament}
            onSync={handleSync}
            syncing={syncing}
          />
        </TabsContent>

        <TabsContent value="tours">
          <ToursAndSeasonsTab
            seasons={seasons}
            counts={counts}
            syncLogs={syncLogs}
            selectedTournament={selectedTournament}
            onSync={handleSync}
            syncing={syncing}
          />
        </TabsContent>

        <TabsContent value="media">
          <MediaAssetsManagement />
        </TabsContent>

        <TabsContent value="history">
          <SyncHistoryTab syncLogs={syncLogs} />
        </TabsContent>
      </Tabs>

      {/* Sync All Confirmation */}
      <AlertDialog open={showSyncAllConfirm} onOpenChange={setShowSyncAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sync all core data (Schedule, Seasons, Players, Rankings) from Sportradar. 
              This may take a few minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncAll}>Sync All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminTourPage;
