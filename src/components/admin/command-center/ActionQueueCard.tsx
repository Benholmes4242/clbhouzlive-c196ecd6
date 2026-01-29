import { cn } from '@/lib/utils';
import { ChevronRight, Loader2, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ActionQueueCardProps {
  /** Queue title */
  title: string;
  /** Count of items in queue */
  count: number;
  /** Icon to display */
  icon: LucideIcon;
  /** Color variant */
  variant?: 'default' | 'warning' | 'danger';
  /** Loading state */
  isLoading?: boolean;
  /** Click handler to navigate to queue */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ActionQueueCard({
  title,
  count,
  icon: Icon,
  variant = 'default',
  isLoading = false,
  onClick,
  className
}: ActionQueueCardProps) {
  const hasItems = count > 0;
  
  const getVariantStyles = () => {
    if (!hasItems) {
      return {
        container: 'bg-card border-border/50',
        icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        badge: 'hidden', // Hide badge when zero
        checkmark: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-muted-foreground'
      };
    }
    
    switch (variant) {
      case 'warning':
        return {
          container: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
          icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-500 text-white',
          checkmark: '',
          text: 'text-foreground'
        };
      case 'danger':
        return {
          container: 'bg-red-500/5 border-red-500/20 hover:border-red-500/40',
          icon: 'bg-red-500/10 text-red-600 dark:text-red-400',
          badge: 'bg-red-500 text-white',
          checkmark: '',
          text: 'text-foreground'
        };
      default:
        return {
          container: 'bg-card border-border hover:border-primary/30',
          icon: 'bg-primary/10 text-primary',
          badge: 'bg-primary text-primary-foreground',
          checkmark: '',
          text: 'text-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <button
      onClick={onClick}
      disabled={!onClick || isLoading}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
        'text-left',
        onClick && hasItems && 'cursor-pointer hover:shadow-sm active:scale-[0.98]',
        !onClick || !hasItems && 'cursor-default',
        styles.container,
        className
      )}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-lg flex-shrink-0', styles.icon)}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={cn('text-sm font-medium', styles.text)}>
          {title}
        </span>
      </div>

      {/* Count badge or checkmark */}
      {!isLoading && (
        hasItems ? (
          <div className={cn(
            'px-2 py-0.5 rounded-full text-xs font-semibold min-w-[1.5rem] text-center',
            styles.badge
          )}>
            {count}
          </div>
        ) : (
          <Check className={cn('h-4 w-4', styles.checkmark)} />
        )
      )}

      {/* Arrow - only when there are items */}
      {onClick && hasItems && !isLoading && (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}
