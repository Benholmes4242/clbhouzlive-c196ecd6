import { cn } from '@/lib/utils';

interface LeaderboardStatProps {
  value: string | number;
  label?: string;
  highlight?: boolean;
  positive?: boolean;
  negative?: boolean;
  className?: string;
}

export function LeaderboardStat({
  value,
  label,
  highlight = false,
  positive = false,
  negative = false,
  className,
}: LeaderboardStatProps) {
  return (
    <div className={cn('text-right', className)}>
      <div
        className={cn(
          'font-extrabold',
          highlight && 'text-primary',
          positive && 'text-green-600 dark:text-green-400',
          negative && 'text-red-600 dark:text-red-400',
        )}
        style={{ fontSize: 22 }}
      >
        {value}
      </div>
      {label && (
        <div className="text-xs text-muted-foreground">{label}</div>
      )}
    </div>
  );
}
