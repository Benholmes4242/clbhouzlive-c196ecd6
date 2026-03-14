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
  seasonColor: _seasonColor,
}: LeaderboardStatProps) {
  return (
    <div className={cn('text-right', className)}>
      <div
        className="text-[22px] font-extrabold"
        style={{ color: 'hsl(var(--accent-amber))' }}
      >
        {value}
      </div>
      {label && (
        <div className="text-xs text-muted-foreground">{label}</div>
      )}
    </div>
  );
}
