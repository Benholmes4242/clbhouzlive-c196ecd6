import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Loader2, History, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecentAuditEntry } from '@/features/admin/hooks/useCommandCenterMetrics';

interface RecentActivitySectionProps {
  data: RecentAuditEntry[] | undefined;
  isLoading: boolean;
}

export function RecentActivitySection({ data, isLoading }: RecentActivitySectionProps) {
  const navigate = useNavigate();
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={() => navigate('/admin/audit')}
        >
          View All
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="rounded-xl border bg-card overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div>
            {entries.map((entry, index) => (
              <AuditLogRow key={entry.id} entry={entry} isEven={index % 2 === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Action color mapping for left border
const actionBorderColors: Record<string, string> = {
  create: 'border-l-emerald-500',
  update: 'border-l-blue-500',
  delete: 'border-l-red-500',
  invite: 'border-l-purple-500',
  approve: 'border-l-emerald-500',
  reject: 'border-l-red-500',
  default: 'border-l-muted-foreground/30'
};

const actionBadgeStyles: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  update: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  delete: 'bg-red-500/10 text-red-700 dark:text-red-400',
  invite: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  approve: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  reject: 'bg-red-500/10 text-red-700 dark:text-red-400',
  default: 'bg-muted text-muted-foreground'
};

function getActionStyle(action: string, styles: Record<string, string>) {
  const lowerAction = action.toLowerCase();
  for (const [key, style] of Object.entries(styles)) {
    if (key !== 'default' && lowerAction.includes(key)) return style;
  }
  return styles.default;
}

function AuditLogRow({ entry, isEven }: { entry: RecentAuditEntry; isEven: boolean }) {
  const borderColor = getActionStyle(entry.action, actionBorderColors);
  const badgeStyle = getActionStyle(entry.action, actionBadgeStyles);

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-l-3 transition-colors',
      borderColor,
      isEven ? 'bg-card' : 'bg-muted/30'
    )}>
      {/* Action badge */}
      <span className={cn(
        'px-2 py-0.5 rounded text-xs font-medium capitalize min-w-[70px] text-center',
        badgeStyle
      )}>
        {entry.action}
      </span>
      
      {/* Target - more prominent */}
      <div className="flex-1 min-w-0">
        {entry.targetEmail ? (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {entry.targetEmail}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
      
      {/* Timestamp - less prominent */}
      <time className="text-xs text-muted-foreground/70 flex-shrink-0">
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
