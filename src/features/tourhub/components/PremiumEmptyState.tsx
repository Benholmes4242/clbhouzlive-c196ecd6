import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PremiumEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function PremiumEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: PremiumEmptyStateProps) {
  return (
    <div className={cn(
      "bg-surface-card border border-border-subtle rounded-sq-lg p-8 text-center",
      className
    )}>
      {Icon && (
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-alt flex items-center justify-center">
          <Icon className="w-6 h-6 text-text-tertiary" />
        </div>
      )}
      
      <h3 className="text-body-lg font-semibold text-text-primary mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-body-sm text-text-secondary max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-sq-sm bg-primary-accent text-white text-body-sm font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
