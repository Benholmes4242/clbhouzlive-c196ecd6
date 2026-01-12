import { cn } from '@/lib/utils';

interface StatusChipProps {
  status: 'live' | 'upcoming' | 'complete';
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide",
      // Live: red background with pulse animation
      status === 'live' && "bg-red-500 text-white",
      // Upcoming: light green tint
      status === 'upcoming' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      // Completed: subtle grey
      status === 'complete' && "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      className
    )}>
      {status === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {status === 'live' ? 'LIVE' : status === 'upcoming' ? 'UPCOMING' : 'FINAL'}
    </span>
  );
}
