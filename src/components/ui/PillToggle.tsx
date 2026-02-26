import React from 'react';
import { cn } from '@/lib/utils';

interface PillToggleOption {
  id: string;
  label: string;
}

interface PillToggleProps {
  options: PillToggleOption[];
  selected: string;
  onSelect: (id: string) => void;
  size?: 'default' | 'small';
  className?: string;
}

/**
 * PillToggle - Tier 2 sub-filter with orange underline
 * 
 * Features:
 * - Orange underline on active tab
 * - No track/container background
 * - Smooth transitions + tap feedback
 */
export const PillToggle: React.FC<PillToggleProps> = ({ 
  options, 
  selected, 
  onSelect, 
  size = 'default',
  className,
}) => {
  const textClass = size === 'small' ? 'text-xs' : 'text-sm';
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            textClass,
            'relative px-3 py-2 min-h-[44px] whitespace-nowrap transition-all duration-200 active:scale-[0.97]',
            'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:transition-all after:duration-200',
            selected === option.id 
              ? 'text-foreground font-semibold after:bg-[hsl(var(--tab-orange))]' 
              : 'text-muted-foreground font-medium hover:text-foreground after:bg-transparent'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default PillToggle;
