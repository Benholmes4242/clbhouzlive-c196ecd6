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
 * PillTabs — Pinpoint sub-tab pill (8px radius, foreground active)
 */
export const PillTabs: React.FC<PillTabsProps> = ({
  options,
  activeId,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
            className="px-4 min-h-[36px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold"
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
