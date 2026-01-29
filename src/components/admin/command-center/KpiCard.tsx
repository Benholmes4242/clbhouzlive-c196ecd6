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
  /** Previous period value (used to determine if trend should show) */
  previousValue?: number;
  /** Whether up trend is positive (green) or negative (red) */
  trendUpIsGood?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Card variant - all now use consistent styling */
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
  previousValue,
  trendUpIsGood = true,
  isLoading = false,
  variant = 'default',
  className,
  onClick
}: KpiCardProps) {
  // All cards now use consistent white background - differentiation via icon color
  const variantStyles = {
    default: 'bg-card border-border',
    highlight: 'bg-card border-border', // Was cream, now consistent
    warning: 'bg-card border-amber-500/20',
    success: 'bg-card border-emerald-500/20'
  };

  const iconContainerStyles = {
    default: 'bg-muted',
    highlight: 'bg-primary/10',
    warning: 'bg-amber-500/10',
    success: 'bg-emerald-500/10'
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    highlight: 'text-primary',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-emerald-600 dark:text-emerald-400'
  };

  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-muted-foreground';
    const isPositive = trend === 'up';
    const isGood = trendUpIsGood ? isPositive : !isPositive;
    return isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  };

  // Determine if we should show the trend indicator
  const currentValue = typeof value === 'number' ? value : 0;
  const hasMeaningfulTrend = !(currentValue === 0 && previousValue === 0);
  const showTrend = trend && trendPercent !== undefined && hasMeaningfulTrend && !isLoading;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all duration-200',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-[0.98]',
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
            
            {/* Trend indicator - hidden when no meaningful trend */}
            {showTrend && (
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
        
        {/* Icon with variant-based coloring */}
        {Icon && (
          <div className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            iconContainerStyles[variant]
          )}>
            <Icon className={cn('h-4 w-4', iconStyles[variant])} />
          </div>
        )}
      </div>
    </div>
  );
}
