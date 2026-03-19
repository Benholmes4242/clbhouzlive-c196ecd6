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
  activeColor?: string; // legacy — ignored, use variant
  variant?: 'default' | 'filter';
}

/**
 * PillToggle — Pinpoint sub-tab pill
 * variant='default': 8px foreground active
 * variant='filter': 8px orange gradient active
 */
export const PillToggle: React.FC<PillToggleProps> = ({
  options,
  selected,
  onSelect,
  size = 'default',
  className,
  activeColor,
  variant = 'default',
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {options.map((option) => {
        const isActive = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="shrink-0 min-h-[36px] px-4 text-sm font-semibold transition-colors flex items-center active:scale-[0.97]"
            style={{
              borderRadius: 8,
              background: isActive ? 'hsl(var(--foreground))' : 'transparent',
              color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
              border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default PillToggle;
