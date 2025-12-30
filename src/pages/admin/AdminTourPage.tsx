import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  RefreshCw, Calendar, MapPin, Trophy, DollarSign, ChevronDown, ChevronRight,
  Users, Crown, LayoutGrid, Clock, BarChart3, User, TrendingUp, Globe, Layers
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  created_at: string;
  updated_at: string;
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

interface DataSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  needsTournament?: boolean;
  needsPlayer?: boolean;
  countKey?: string;
}

const DATA_SECTIONS: DataSection[] = [
  { id: 'schedule', title: 'Tournament Schedule', description: 'All tournaments for the season with dates, venues, purses', icon: <Calendar className="h-4 w-4" />, action: 'schedule', countKey: 'tournaments' },
  { id: 'seasons', title: 'Seasons', description: 'All available seasons per tour', icon: <Layers className="h-4 w-4" />, action: 'seasons', countKey: 'seasons' },
  { id: 'players', title: 'Players', description: 'Height, weight, DOB, residence, college', icon: <Users className="h-4 w-4" />, action: 'players', countKey: 'players' },
  { id: 'rankings', title: 'World Golf Rankings', description: 'Top 200 players with points', icon: <Crown className="h-4 w-4" />, action: 'rankings', countKey: 'rankings' },
  { id: 'leaderboard', title: 'Tournament Leaderboard', description: 'Real-time positions, player stats per round, live scoring', icon: <Trophy className="h-4 w-4" />, action: 'leaderboard', needsTournament: true, countKey: 'leaderboards' },
  { id: 'summary', title: 'Tournament Summary', description: 'Location, course layout, full tournament field', icon: <LayoutGrid className="h-4 w-4" />, action: 'summary', needsTournament: true, countKey: 'summaries' },
  { id: 'scorecards', title: 'Scorecards', description: 'Hole-by-hole scoring, player info, course info', icon: <BarChart3 className="h-4 w-4" />, action: 'scorecards', needsTournament: true, countKey: 'scorecards' },
  { id: 'tee_times', title: 'Tee Times', description: 'Pairings, starting positions, tee times per round', icon: <Clock className="h-4 w-4" />, action: 'tee_times', needsTournament: true, countKey: 'tee_times' },
  { id: 'hole_stats', title: 'Hole Statistics', description: 'How the field performed on each hole', icon: <TrendingUp className="h-4 w-4" />, action: 'hole_stats', needsTournament: true, countKey: 'hole_stats' },
  { id: 'player_stats', title: 'Player Statistics', description: 'Season stats (FedEx Cup points, etc.)', icon: <BarChart3 className="h-4 w-4" />, action: 'player_stats', countKey: 'player_stats' },
  { id: 'courses', title: 'Course Info', description: 'Latitude/longitude, layouts, hole details', icon: <Globe className="h-4 w-4" />, action: 'summary', countKey: 'courses' },
];

export function AdminTourPage() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['schedule']));
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);

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
        .limit(50);
      if (error) throw error;
      return data as SyncLog[];
    },
  });

  // Get latest sync status per endpoint type
  const getLatestSyncForAction = (action: string) => {
    return syncLogs?.find(log => log.sync_type === action);
  };

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

  // Sync mutation - now passes all required params for tournament-specific endpoints
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
      queryClient.invalidateQueries({ queryKey: ['sr-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['sr-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sr-counts'] });
      queryClient.invalidateQueries({ queryKey: ['sr-players'] });
      queryClient.invalidateQueries({ queryKey: ['sr-rankings'] });
      queryClient.invalidateQueries({ queryKey: ['sr-leaderboards'] });
      queryClient.invalidateQueries({ queryKey: ['sr-courses'] });
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

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'inprogress': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'closed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const renderSectionContent = (section: DataSection) => {
    switch (section.id) {
      case 'schedule':
        return (
          <div className="space-y-3">
            {tournamentsLoading ? (
              <div className="text-muted-foreground">Loading tournaments...</div>
            ) : tournaments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tournaments synced yet</p>
              </div>
            ) : (
              tournaments?.map((tournament) => (
                <div key={tournament.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={tournament.is_featured}
                    onCheckedChange={(checked) => toggleFeaturedMutation.mutate({ id: tournament.id, is_featured: !!checked })}
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
                    variant="outline"
                    onClick={() => {
                      setSelectedTournament(tournament);
                      toast.info(`Selected: ${tournament.name}`);
                    }}
                    className={selectedTournament?.sr_id === tournament.sr_id ? 'border-primary' : ''}
                  >
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
        );

      case 'seasons':
        return (
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
        );

      case 'players':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {players?.map((player) => (
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
        );

      case 'rankings':
        return (
          <div className="space-y-2">
            {rankings?.map((ranking: any) => (
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
        );

      case 'leaderboard':
        return (
          <div className="space-y-2">
            {selectedTournament ? (
              leaderboards?.filter((l: any) => l.sr_tournaments?.name)?.map((entry: any) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a tournament above to sync leaderboard</p>
              </div>
            )}
            {leaderboards && leaderboards.length > 0 && (
              <div className="text-sm text-muted-foreground mt-4">Showing top {leaderboards.length} entries</div>
            )}
          </div>
        );

      case 'courses':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses?.map((course: any) => (
              <div key={course.id} className="p-4 rounded-lg border border-border bg-card">
                <div className="font-medium">{course.name}</div>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  {(course.city || course.state) && <div>📍 {[course.city, course.state, course.country].filter(Boolean).join(', ')}</div>}
                  {course.par && <div>⛳ Par {course.par}</div>}
                  {course.yardage && <div>📏 {course.yardage.toLocaleString()} yards</div>}
                  {(course.latitude && course.longitude) && (
                    <div>🌍 {course.latitude.toFixed(4)}, {course.longitude.toFixed(4)}</div>
                  )}
                </div>
              </div>
            ))}
            {(!courses || courses.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No courses synced yet</div>
            )}
          </div>
        );

      case 'player_stats':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {playerStats?.map((stat: any) => (
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
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click Sync to fetch data for this endpoint</p>
            {section.needsTournament && !selectedTournament && (
              <p className="text-sm mt-2">⚠️ Select a tournament from the Schedule section first</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tour Data</h1>
          <p className="text-muted-foreground">Manage tournament data from Sportradar API</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.tournaments || 0}</div>
          <div className="text-xs text-muted-foreground">Tournaments</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.players || 0}</div>
          <div className="text-xs text-muted-foreground">Players</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.rankings || 0}</div>
          <div className="text-xs text-muted-foreground">Rankings</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.leaderboards || 0}</div>
          <div className="text-xs text-muted-foreground">Leaderboard</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.courses || 0}</div>
          <div className="text-xs text-muted-foreground">Courses</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.scorecards || 0}</div>
          <div className="text-xs text-muted-foreground">Scorecards</div>
        </Card>
      </div>

      {/* Recent Syncs */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Recent Syncs</CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          <div className="flex flex-wrap gap-2">
            {syncLogs?.slice(0, 5).map((log) => (
              <Badge key={log.id} variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                {log.sync_type}: {log.records_synced || 0}
              </Badge>
            ))}
            {(!syncLogs || syncLogs.length === 0) && <span className="text-sm text-muted-foreground">No sync history</span>}
          </div>
        </CardContent>
      </Card>

      {/* Data Sections */}
      <div className="space-y-3">
        {DATA_SECTIONS.map((section) => (
          <Collapsible key={section.id} open={openSections.has(section.id)} onOpenChange={() => toggleSection(section.id)}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {openSections.has(section.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="p-2 rounded-md bg-primary/10">{section.icon}</div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="text-xs">{section.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Sync Status Indicator */}
                      {(() => {
                        const latestSync = getLatestSyncForAction(section.action);
                        if (latestSync) {
                          const isError = latestSync.status === 'error';
                          const timeAgo = latestSync.completed_at 
                            ? format(parseISO(latestSync.completed_at), 'MMM d, h:mm a')
                            : 'pending';
                          return (
                            <div className={`text-xs text-right max-w-[180px] ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
                              <div className="truncate">
                                {isError ? '❌ ' : '✓ '}{timeAgo}
                              </div>
                              {isError && latestSync.error_message && (
                                <div className="truncate text-[10px] opacity-75" title={latestSync.error_message}>
                                  {latestSync.error_message}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <Badge variant="outline">
                        {counts?.[section.countKey as keyof typeof counts] || 0} records
                      </Badge>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (section.needsTournament && !selectedTournament) {
                            toast.error('Please select a tournament first');
                            return;
                          }
                          // Get round type from tournament's scoring_system (default to 'stroke')
                          const roundType = selectedTournament?.scoring_system || 'stroke';
                          syncMutation.mutate({ 
                            action: section.action, 
                            tournamentId: selectedTournament?.sr_id,
                            seasonYear: 2025,
                            roundType,
                            roundNumber: selectedRound
                          });
                        }}
                        disabled={syncing === section.action}
                        className="gap-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${syncing === section.action ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 max-h-[500px] overflow-y-auto">
                  {renderSectionContent(section)}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

export default AdminTourPage;
