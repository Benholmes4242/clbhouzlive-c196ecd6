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
  variant = 'default',
}) => {
  const h = size === 'small' ? '30px' : '36px';
  const px = size === 'small' ? '11px' : '14px';
  const fs = size === 'small' ? 12 : 13;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {options.map((option) => {
        const isActive = selected === option.id;
        const activeBg = variant === 'filter'
          ? 'linear-gradient(90deg, #F59E0B, #F7931E)'
          : 'hsl(var(--foreground))';
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            style={{
              height: h,
              paddingLeft: px,
              paddingRight: px,
              borderRadius: 8,
              fontSize: fs,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
              transition: 'all 0.18s ease',
              background: isActive ? activeBg : 'transparent',
              color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
              border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
              boxShadow: isActive && variant === 'filter' ? '0 2px 8px rgba(247,147,30,0.22)' : 'none',
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
