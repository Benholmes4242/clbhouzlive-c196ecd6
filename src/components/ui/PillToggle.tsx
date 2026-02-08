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
 * PillToggle - Apple-style pill toggle for tab/filter selection
 * 
 * Features:
 * - Rounded-full pill container
 * - Active button with shadow
 * - Smooth transitions + tap feedback
 */
export const PillToggle: React.FC<PillToggleProps> = ({ 
  options, 
  selected, 
  onSelect, 
  size = 'default',
  className,
}) => {
  const baseClasses = size === 'small' 
    ? 'px-3 py-2 text-xs' 
    : 'px-4 py-2.5 text-sm';
  
  return (
    <div className={cn('inline-flex bg-muted rounded-full p-1', className)}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            baseClasses,
            'font-medium rounded-full transition-all duration-200 ease-out whitespace-nowrap active:scale-[0.97]',
            selected === option.id 
              ? 'bg-card text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default PillToggle;