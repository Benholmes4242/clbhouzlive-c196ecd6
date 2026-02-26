import React from 'react';
import { cn } from '@/lib/utils';

export interface PillOption {
  id: string;
  label: string;
}

interface PillTabsProps {
  options: PillOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Shared tab component with orange underline active state.
 */
export const PillTabs: React.FC<PillTabsProps> = ({
  options,
  activeId,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative px-3 py-2 min-h-[44px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97]',
              'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:transition-all after:duration-200',
              isActive
                ? 'text-foreground font-semibold after:bg-[hsl(var(--tab-orange))]'
                : 'text-muted-foreground font-medium hover:text-foreground after:bg-transparent'
            )}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
