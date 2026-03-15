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
    <div className="flex items-center gap-1 p-1" style={{ background: '#F1F5F9', borderRadius: 12 }}>
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3 py-1 text-[12px] font-semibold transition-all duration-100"
          style={value === opt.value
            ? { background: '#FFF7ED', color: '#F5A623', borderRadius: 8, border: '1px solid #FED7AA' }
            : { color: '#64748B', borderRadius: 8, border: '1px solid transparent' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
