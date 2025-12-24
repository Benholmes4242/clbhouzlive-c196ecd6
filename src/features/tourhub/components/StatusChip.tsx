import { cn } from '@/lib/utils';

interface StatusChipProps {
  status: 'live' | 'upcoming' | 'complete';
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sq-pill text-meta font-medium uppercase tracking-wide",
      status === 'live' && "bg-primary-accent/10 text-primary-accent",
      status === 'upcoming' && "bg-surface-alt text-text-secondary border border-border-subtle",
      status === 'complete' && "bg-surface-alt text-text-tertiary",
      className
    )}>
      {status === 'live' && (
        <span className="w-2 h-2 rounded-full bg-primary-accent animate-pulse" />
      )}
      {status === 'live' ? 'LIVE' : status === 'upcoming' ? 'UPCOMING' : 'FINAL'}
    </span>
  );
}
