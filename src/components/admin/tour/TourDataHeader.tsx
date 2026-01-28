import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number | null;
  started_at: string;
  completed_at: string | null;
}

interface TourDataHeaderProps {
  counts: {
    tournaments: number;
    players: number;
    rankings: number;
    courses: number;
    seasons: number;
    leaderboards: number;
  } | undefined;
  latestSync: SyncLog | undefined;
  onSyncAll: () => void;
  isSyncing: boolean;
}

export const TourDataHeader: React.FC<TourDataHeaderProps> = ({
  counts,
  latestSync,
  onSyncAll,
  isSyncing,
}) => {
  const getApiHealthStatus = () => {
    if (!latestSync) return { status: 'unknown', color: 'bg-muted' };
    if (latestSync.status === 'success') return { status: 'Healthy', color: 'bg-green-500' };
    if (latestSync.status === 'error') return { status: 'Error', color: 'bg-red-500' };
    return { status: 'Pending', color: 'bg-yellow-500' };
  };

  const health = getApiHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tour Data Management</h1>
          <p className="text-muted-foreground">Sportradar Integration</p>
        </div>
        <div className="flex items-center gap-3">
          {/* API Health Status */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">API Status:</span>
            <Badge variant="outline" className="gap-1.5">
              <span className={`h-2 w-2 rounded-full ${health.color}`} />
              {health.status}
            </Badge>
          </div>
          
          {/* Last Sync */}
          {latestSync?.completed_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last sync: {format(parseISO(latestSync.completed_at), 'MMM d, h:mm a')}</span>
            </div>
          )}

          {/* Sync All Button */}
          <Button onClick={onSyncAll} disabled={isSyncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
          <div className="text-2xl font-bold">{counts?.courses || 0}</div>
          <div className="text-xs text-muted-foreground">Courses</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.seasons || 0}</div>
          <div className="text-xs text-muted-foreground">Seasons</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts?.leaderboards || 0}</div>
          <div className="text-xs text-muted-foreground">Leaderboards</div>
        </Card>
      </div>
    </div>
  );
};
