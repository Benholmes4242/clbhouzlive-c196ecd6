import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { RefreshCw, Calendar, MapPin, Trophy, DollarSign, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  const [syncing, setSyncing] = useState(false);

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
  const { data: syncLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['sr-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as SyncLog[];
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke('sportradar-sync', {
        body: { action: 'schedule', tourId: 'pga', year: 2025 },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sync complete: ${data.records_synced || 0} tournaments synced`);
      queryClient.invalidateQueries({ queryKey: ['sr-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['sr-sync-logs'] });
      setSyncing(false);
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
      setSyncing(false);
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
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'inprogress':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tour Data</h1>
          <p className="text-muted-foreground">
            Manage tournament data from Sportradar API
          </p>
        </div>
        <Button 
          onClick={() => syncMutation.mutate()} 
          disabled={syncing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Schedule'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tournaments?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Tournaments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tournaments?.filter(t => t.is_featured).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Featured</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tournaments?.filter(t => t.status === 'inprogress').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tournaments?.filter(t => t.status === 'scheduled').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Syncs</CardTitle>
          <CardDescription>Last 10 synchronization attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : syncLogs?.length === 0 ? (
            <div className="text-muted-foreground">No sync history yet</div>
          ) : (
            <div className="space-y-2">
              {syncLogs?.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                      {log.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {log.sync_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {log.records_synced !== null && (
                      <span className="text-muted-foreground">
                        {log.records_synced} records
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {format(parseISO(log.started_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tournaments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tournaments</CardTitle>
          <CardDescription>
            Check tournaments to feature them on the TourHub page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentsLoading ? (
            <div className="text-muted-foreground">Loading tournaments...</div>
          ) : tournaments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tournaments synced yet</p>
              <p className="text-sm">Click "Sync Schedule" to fetch tournament data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments?.map((tournament) => (
                <div 
                  key={tournament.id} 
                  className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={tournament.is_featured}
                    onCheckedChange={(checked) => {
                      toggleFeaturedMutation.mutate({
                        id: tournament.id,
                        is_featured: !!checked,
                      });
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground truncate">
                        {tournament.name}
                      </h3>
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status || 'Unknown'}
                      </Badge>
                      {tournament.is_featured && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Featured
                        </Badge>
                      )}
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
                      
                      {tournament.venue_course_name && (
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5" />
                          {tournament.venue_course_name}
                          {tournament.venue_par && ` (Par ${tournament.venue_par})`}
                        </span>
                      )}
                    </div>

                    {tournament.defending_champion && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Defending: {tournament.defending_champion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminTourPage;
