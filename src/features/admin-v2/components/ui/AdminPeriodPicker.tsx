import React from 'react';
import { cn } from '@/lib/utils';
import type { AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';

const OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d',  label: '7d'  },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

interface AdminPeriodPickerProps {
  value: AnalyticsPeriod;
  onChange: (v: AnalyticsPeriod) => void;
}

export function AdminPeriodPicker({ value, onChange }: AdminPeriodPickerProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1 rounded-md text-[12px] font-semibold transition-all duration-100',
            value === opt.value
              ? 'bg-foreground text-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
