import { cn } from '@/lib/utils';
import { getHandicapBadgeStyle } from '@/lib/formatHcp';

interface HandicapStatusPillProps {
  label: string;
  handicap: number;
  seasonColor?: string;
  className?: string;
}

export function HandicapStatusPill({ label, handicap, seasonColor, className }: HandicapStatusPillProps) {
  const colors = getHandicapBadgeStyle(handicap, seasonColor);
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  );
}
