import { cn } from '@/lib/utils';

interface StatPillProps {
  label: string;
  value: string | number | null | undefined;
  className?: string;
  variant?: 'default' | 'muted';
}

export function StatPill({ label, value, className, variant = 'default' }: StatPillProps) {
  const hasValue = value !== null && value !== undefined && value !== '';
  
  return (
    <div className={cn(
      "px-3 py-2 rounded-lg text-center",
      variant === 'default' ? 'bg-muted/50' : 'bg-muted/30',
      className
    )}>
      <div className={cn(
        "text-lg font-bold",
        hasValue ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {hasValue ? value : '—'}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string | number | null | undefined;
  format?: (v: number) => string;
}

export function StatRow({ label, value, format }: StatRowProps) {
  const hasValue = value !== null && value !== undefined;
  const displayValue = hasValue 
    ? (typeof value === 'number' && format ? format(value) : value)
    : '—';
  
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-medium",
        hasValue ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {displayValue}
      </span>
    </div>
  );
}
