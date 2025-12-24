import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface LastUpdatedPillProps {
  timestamp: string | null;
  className?: string;
}

export function LastUpdatedPill({ timestamp, className }: LastUpdatedPillProps) {
  if (!timestamp) return null;
  
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: false });
  const display = timeAgo === 'less than a minute' ? 'just now' : `${timeAgo} ago`;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-3 py-1 rounded-sq-pill bg-surface-alt border border-border-subtle text-meta text-text-tertiary",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary/50" />
      Updated {display}
    </span>
  );
}
