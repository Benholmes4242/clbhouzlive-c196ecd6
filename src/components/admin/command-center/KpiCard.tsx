import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  /** Card title/label */
  title: string;
  /** Main value to display */
  value: number | string;
  /** Optional subtitle or context */
  subtitle?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend percentage (absolute value) */
  trendPercent?: number;
  /** Whether up trend is positive (green) or negative (red) */
  trendUpIsGood?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Card variant */
  variant?: 'default' | 'highlight' | 'warning' | 'success';
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPercent,
  trendUpIsGood = true,
  isLoading = false,
  variant = 'default',
  className,
  onClick
}: KpiCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    highlight: 'bg-primary/5 border-primary/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    success: 'bg-emerald-500/10 border-emerald-500/20'
  };

  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-muted-foreground';
    const isPositive = trend === 'up';
    const isGood = trendUpIsGood ? isPositive : !isPositive;
    return isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all duration-200',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/30',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          
          {/* Value */}
          <div className="mt-1 flex items-baseline gap-2">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-2xl font-bold text-foreground">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
            )}
            
            {/* Trend indicator */}
            {trend && trendPercent !== undefined && !isLoading && (
              <span className={cn('flex items-center gap-0.5 text-xs font-medium', getTrendColor())}>
                <TrendIcon className="h-3 w-3" />
                {trendPercent}%
              </span>
            )}
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Icon */}
        {Icon && (
          <div className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            variant === 'highlight' ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Icon className={cn(
              'h-4 w-4',
              variant === 'highlight' ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
        )}
      </div>
    </div>
  );
}
