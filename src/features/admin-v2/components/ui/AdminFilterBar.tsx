import React from 'react';
import { cn } from '@/lib/utils';

type FilterVariant = 'default' | 'warning' | 'danger' | 'success';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  variant?: FilterVariant;
}

interface AdminFilterBarProps {
  filters: FilterOption[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

const COUNT_COLORS: Record<FilterVariant, { bg: string; text: string }> = {
  default: { bg: '#F1F5F9', text: '#64748B' },
  warning: { bg: '#FFF7ED', text: '#F5A623' },
  danger:  { bg: '#FFF1F2', text: '#F31260' },
  success: { bg: '#F0FDF4', text: '#17C964' },
};

export function AdminFilterBar({ filters, active, onChange, className }: AdminFilterBarProps) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {filters.map((filter) => {
        const isActive = active === filter.id;
        const variant = filter.variant ?? 'default';
        const countColor = COUNT_COLORS[variant];

        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-all duration-100 active:scale-[0.97]"
            style={isActive
              ? { background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 20, color: '#F5A623' }
              : { background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 20, color: '#64748B' }
            }
          >
            {filter.label}
            {filter.count !== undefined && (
              <span
                className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold"
                style={isActive
                  ? { background: 'rgba(245,166,35,0.15)', color: '#F5A623' }
                  : { background: countColor.bg, color: countColor.text }
                }
              >
                {filter.count > 999 ? '999+' : filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
