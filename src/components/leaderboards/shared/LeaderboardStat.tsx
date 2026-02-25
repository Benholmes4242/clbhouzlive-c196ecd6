import { cn } from '@/lib/utils';

interface LeaderboardStatProps {
  value: string | number;
  label?: string;
  highlight?: boolean;
  positive?: boolean;
  negative?: boolean;
  className?: string;
  seasonColor?: string;
}

export function LeaderboardStat({
  value,
  label,
  highlight = false,
  positive = false,
  negative = false,
  className,
  seasonColor,
}: LeaderboardStatProps) {
  return (
    <div className={cn('text-right', className)}>
      <div
        className={cn(
          'text-[22px] font-extrabold',
          !seasonColor && highlight && 'text-primary',
          !seasonColor && positive && 'text-green-600 dark:text-green-400',
          !seasonColor && negative && 'text-red-600 dark:text-red-400',
        )}
        style={seasonColor ? { color: seasonColor } : undefined}
      >
        {value}
      </div>
      {label && (
        <div className="text-xs text-muted-foreground">{label}</div>
      )}
    </div>
  );
}
