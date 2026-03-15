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
  activeColor?: string;
}

/**
 * PillToggle - Tier 2 sub-tab pill
 * Active: #475569 filled pill, no track, no underline
 */
export const PillToggle: React.FC<PillToggleProps> = ({ 
  options, 
  selected, 
  onSelect, 
  size = 'default',
  className,
  activeColor,
}) => {
  const textClass = size === 'small' ? 'text-xs' : 'text-sm';
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {options.map((option) => {
        const isActive = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              textClass,
              'px-4 min-h-[36px] rounded-full whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold',
              isActive
                ? 'text-white'
                : 'text-muted-foreground bg-muted'
            )}
            style={isActive ? { backgroundColor: activeColor || 'hsl(var(--tab-sub-active))' } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default PillToggle;
