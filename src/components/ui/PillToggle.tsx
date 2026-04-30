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
    <div className={cn('flex items-center gap-5', className)}>
      {options.map((option) => {
        const isActive = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="shrink-0 min-h-[36px] px-1 text-sm transition-colors flex items-center active:scale-[0.97]"
            style={{
              background: 'transparent',
              border: 'none',
              fontWeight: isActive ? 800 : 500,
              color: isActive ? '#0F172A' : '#94A3B8',
              letterSpacing: isActive ? '-0.01em' : 0,
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
