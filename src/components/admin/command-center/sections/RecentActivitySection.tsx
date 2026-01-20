import { cn } from '@/lib/utils';
import { Loader2, History, User, ExternalLink } from 'lucide-react';
import type { RecentAuditEntry } from '@/features/admin/hooks/useCommandCenterMetrics';

interface RecentActivitySectionProps {
  data: RecentAuditEntry[] | undefined;
  isLoading: boolean;
}

export function RecentActivitySection({ data, isLoading }: RecentActivitySectionProps) {
  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Admin Activity</h2>
        <div className="rounded-xl border bg-card p-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const entries = data ?? [];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Admin Activity</h2>
        <span className="text-xs text-muted-foreground">Last 10 actions</span>
      </div>
      
      <div className="rounded-xl border bg-card overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <AuditLogRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AuditLogRow({ entry }: { entry: RecentAuditEntry }) {
  const actionStyles: Record<string, string> = {
    create: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    update: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    delete: 'bg-red-500/10 text-red-700 dark:text-red-400',
    invite: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    approve: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    reject: 'bg-red-500/10 text-red-700 dark:text-red-400',
    default: 'bg-muted text-muted-foreground'
  };

  const getActionStyle = (action: string) => {
    const lowerAction = action.toLowerCase();
    for (const [key, style] of Object.entries(actionStyles)) {
      if (lowerAction.includes(key)) return style;
    }
    return actionStyles.default;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
      {/* Action badge */}
      <span className={cn(
        'px-2 py-0.5 rounded text-xs font-medium capitalize min-w-[70px] text-center',
        getActionStyle(entry.action)
      )}>
        {entry.action}
      </span>
      
      {/* Target */}
      <div className="flex-1 min-w-0">
        {entry.targetEmail ? (
          <div className="flex items-center gap-1.5 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{entry.targetEmail}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
      
      {/* Timestamp */}
      <time className="text-xs text-muted-foreground flex-shrink-0">
        {formatRelativeTime(entry.createdAt)}
      </time>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
