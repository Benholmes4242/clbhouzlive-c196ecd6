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
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-[10px]",
      "bg-white/20 border border-white/25 text-white/90",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
      Updated {display}
    </span>
  );
}
