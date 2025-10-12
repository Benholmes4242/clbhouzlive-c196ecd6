import { formatDuration, a11yFullDuration } from '@/utils/formatDuration';

interface DurationBadgeProps {
  seconds: number;
  className?: string;
}

export function DurationBadge({ seconds, className }: DurationBadgeProps) {
  return (
    <time 
      className={className || "duration-badge"} 
      title={a11yFullDuration(seconds)} 
      aria-label={a11yFullDuration(seconds)}
    >
      {formatDuration(seconds)}
    </time>
  );
}
