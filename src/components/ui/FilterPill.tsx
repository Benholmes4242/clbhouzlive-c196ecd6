import React from 'react';
import { cn } from '@/lib/utils';

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * FilterPill - Shared filter pill component with black-dot active indicator
 * Used for status filters (All / Played / Not Played) across the app
 */
export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  active = false,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-4 py-2 text-sm',
        'shadow-sm transition-colors',
        active
          ? 'bg-slate-100 text-slate-900'
          : 'bg-white text-slate-600 hover:text-slate-800',
        className
      )}
    >
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default FilterPill;
