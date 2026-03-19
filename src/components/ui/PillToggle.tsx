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
    <div className={cn('flex items-center gap-4', className)} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
      {options.map((option) => {
        const isActive = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="relative px-4 py-2 transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
            style={{
              fontSize: 16,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: isActive ? '-0.025em' : '0',
              color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              background: 'transparent',
              border: 'none',
              minHeight: 44,
              cursor: 'pointer',
            }}
          >
            {option.label}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2.5,
                  borderRadius: 2,
                  background: activeColor || 'linear-gradient(90deg, #F59E0B, #F7931E)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PillToggle;
