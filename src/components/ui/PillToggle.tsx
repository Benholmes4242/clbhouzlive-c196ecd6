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
 * PillToggle - Tier 2 sub-filter pill toggle
 * 
 * Features:
 * - Subtle track background
 * - Active button with bg-card, no shadow
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
    : 'px-4 py-2 text-[14px]';
  
  return (
    <div 
      className={cn('inline-flex rounded-xl p-1', className)}
      style={{ background: 'rgba(0, 0, 0, 0.04)' }}
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            baseClasses,
            'font-medium rounded-xl transition-all duration-200 ease-out whitespace-nowrap active:scale-[0.97]',
            selected === option.id 
              ? 'bg-card text-foreground font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.06)]' 
              : 'text-muted-foreground hover:text-foreground/70'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default PillToggle;
