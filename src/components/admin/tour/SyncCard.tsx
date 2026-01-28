import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface SyncCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  latestSync?: SyncLog;
  recordsCount: number;
  onSync: () => void;
  isSyncing: boolean;
  disabled?: boolean;
  disabledReason?: string;
  children?: React.ReactNode;
}

export const SyncCard: React.FC<SyncCardProps> = ({
  title,
  description,
  icon,
  latestSync,
  recordsCount,
  onSync,
  isSyncing,
  disabled,
  disabledReason,
  children,
}) => {
  const getSyncStatus = () => {
    if (!latestSync) return { status: 'Never synced', icon: <Clock className="h-4 w-4 text-muted-foreground" />, color: 'text-muted-foreground' };
    if (latestSync.status === 'success') return { status: 'Success', icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'text-green-500' };
    if (latestSync.status === 'error') return { status: 'Error', icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'text-red-500' };
    return { status: 'Pending', icon: <Clock className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-500' };
  };

  const syncStatus = getSyncStatus();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">{icon}</div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onSync}
            disabled={isSyncing || disabled}
            title={disabled ? disabledReason : undefined}
            className="gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {/* Sync Status Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {syncStatus.icon}
            <span className={`text-sm ${syncStatus.color}`}>{syncStatus.status}</span>
            {latestSync?.completed_at && (
              <span className="text-xs text-muted-foreground">
                • {format(parseISO(latestSync.completed_at), 'MMM d, h:mm a')}
              </span>
            )}
          </div>
          <Badge variant="outline">{recordsCount} records</Badge>
        </div>

        {/* Error Message */}
        {latestSync?.status === 'error' && latestSync.error_message && (
          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
            {latestSync.error_message}
          </div>
        )}
      </CardHeader>
      
      {children && (
        <CardContent className="pt-0 max-h-[400px] overflow-y-auto">
          {children}
        </CardContent>
      )}
    </Card>
  );
};
