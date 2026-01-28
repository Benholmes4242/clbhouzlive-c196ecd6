import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';
import { format, parseISO, differenceInSeconds } from 'date-fns';

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface SyncHistoryTabProps {
  syncLogs: SyncLog[] | undefined;
}

export const SyncHistoryTab: React.FC<SyncHistoryTabProps> = ({ syncLogs }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  // Get unique sync types
  const syncTypes = useMemo(() => {
    const types = new Set(syncLogs?.map(log => log.sync_type) || []);
    return Array.from(types).sort();
  }, [syncLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!syncLogs) return [];
    
    return syncLogs.filter(log => {
      const matchesSearch = log.sync_type.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchesType = typeFilter === 'all' || log.sync_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [syncLogs, search, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Success</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 gap-1"><XCircle className="h-3 w-3" />Error</Badge>;
      case 'running':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1"><Clock className="h-3 w-3" />Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDuration = (log: SyncLog) => {
    if (!log.completed_at) return '-';
    const seconds = differenceInSeconds(parseISO(log.completed_at), parseISO(log.started_at));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  // Stats
  const stats = useMemo(() => {
    if (!syncLogs) return { total: 0, success: 0, error: 0, running: 0 };
    return {
      total: syncLogs.length,
      success: syncLogs.filter(l => l.status === 'success').length,
      error: syncLogs.filter(l => l.status === 'error').length,
      running: syncLogs.filter(l => l.status === 'running').length,
    };
  }, [syncLogs]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Syncs</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          <div className="text-xs text-muted-foreground">Successful</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.running}</div>
          <div className="text-xs text-muted-foreground">Running</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Sync History
            </CardTitle>
            <div className="flex flex-1 flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sync type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sync Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {syncTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sync Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sync logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                      <TableCell className="font-medium">{log.sync_type}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-right">{log.records_synced || 0}</TableCell>
                      <TableCell className="text-right">{getDuration(log)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(parseISO(log.started_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Sync Type</div>
                  <div className="font-medium">{selectedLog.sync_type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Records Synced</div>
                  <div className="font-medium">{selectedLog.records_synced || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">{getDuration(selectedLog)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Started</div>
                  <div className="font-medium">{format(parseISO(selectedLog.started_at), 'MMM d, yyyy h:mm:ss a')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="font-medium">
                    {selectedLog.completed_at 
                      ? format(parseISO(selectedLog.completed_at), 'MMM d, yyyy h:mm:ss a')
                      : 'In progress...'}
                  </div>
                </div>
              </div>
              {selectedLog.error_message && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Error Message</div>
                  <div className="p-3 bg-destructive/10 rounded text-sm text-destructive">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
