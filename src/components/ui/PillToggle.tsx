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
    <div 
      className={cn('inline-flex rounded-[14px] p-[3px]', className)}
      style={{ background: 'rgba(0, 0, 0, 0.03)' }}
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            baseClasses,
            'font-medium rounded-xl transition-all duration-200 ease-out whitespace-nowrap active:scale-[0.97]',
            selected === option.id 
              ? 'bg-card text-foreground font-semibold' 
              : 'text-muted-foreground hover:text-foreground/70'
          )}
          style={selected === option.id ? {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          } : undefined}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default PillToggle;