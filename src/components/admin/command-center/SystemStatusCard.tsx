import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Clock, Zap } from 'lucide-react';
import type { SystemStatus } from '@/features/admin/hooks/useCommandCenterMetrics';

export interface SystemStatusCardProps {
  status: SystemStatus | undefined;
  isLoading?: boolean;
  className?: string;
}

export function SystemStatusCard({ status, isLoading, className }: SystemStatusCardProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card p-4', className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Checking system status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={cn('rounded-xl border bg-card p-4', className)}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">Status unavailable</span>
        </div>
      </div>
    );
  }

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return 'text-muted-foreground';
    if (ms < 100) return 'text-emerald-600 dark:text-emerald-400';
    if (ms < 300) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLatencyLabel = (ms: number | null) => {
    if (ms === null) return 'Unknown';
    if (ms < 100) return 'Excellent';
    if (ms < 300) return 'Good';
    return 'Slow';
  };

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-colors',
      status.isHealthy 
        ? 'bg-emerald-500/5 border-emerald-500/20' 
        : 'bg-red-500/5 border-red-500/20',
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {status.isHealthy ? (
            <div className="p-2 rounded-lg bg-emerald-500/10 relative">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 relative z-10" />
              {/* Pulse animation ring */}
              <div className="absolute inset-0 rounded-lg bg-emerald-500/20 animate-ping" 
                   style={{ animationDuration: '2s' }} />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          )}
          
          <div>
            <h4 className={cn(
              'text-sm font-semibold',
              status.isHealthy 
                ? 'text-emerald-700 dark:text-emerald-300' 
                : 'text-red-700 dark:text-red-300'
            )}>
              {status.isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
            </h4>
            
            {status.errorMessage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {status.errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Metrics - made more prominent */}
        <div className="flex items-center gap-5 text-xs">
          {/* Latency - more prominent */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-md',
              status.latencyMs !== null && status.latencyMs < 100 
                ? 'bg-emerald-500/10' 
                : status.latencyMs !== null && status.latencyMs < 300 
                  ? 'bg-amber-500/10' 
                  : 'bg-red-500/10'
            )}>
              <Zap className={cn('h-4 w-4', getLatencyColor(status.latencyMs))} />
            </div>
            <div className="text-right">
              <div className={cn('text-base font-bold', getLatencyColor(status.latencyMs))}>
                {status.latencyMs !== null ? `${status.latencyMs}ms` : '—'}
              </div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wide">
                {getLatencyLabel(status.latencyMs)}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* Last sync */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="text-right">
              <div className="font-medium text-foreground">
                {status.lastSyncAt ? formatTime(status.lastSyncAt) : '—'}
              </div>
              <div className="text-muted-foreground text-[10px]">Last check</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}
