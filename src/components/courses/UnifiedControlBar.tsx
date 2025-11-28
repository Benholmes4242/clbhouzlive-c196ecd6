import React from 'react';
import { ChevronDown } from 'lucide-react';

type UnifiedControlBarProps = {
  from: number;
  to: number;
  total: number;
  sortLabel: string;
  onSortClick: () => void;
  onFiltersClick?: () => void;
  className?: string;
};

export function UnifiedControlBar({
  from,
  to,
  total,
  sortLabel,
  onSortClick,
  onFiltersClick,
  className = '',
}: UnifiedControlBarProps) {
  return (
    <div
      className={`
        mt-3 mb-3
        flex items-center justify-between
        rounded-2xl
        px-3 py-2.5
        bg-card/80
        border border-border/60
        shadow-sm
        text-xs
        ${className}
      `}
    >
      {/* Left: range / total */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground">
          Showing {from}–{to} of {total.toLocaleString()} courses
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 ml-2">
        {/* Sort */}
        <button
          type="button"
          onClick={onSortClick}
          className="
            inline-flex items-center gap-1.5
            rounded-full
            px-3 py-1.5
            text-xs font-medium
            bg-background
            border border-border/60
            shadow-sm
            hover:bg-slate-50
            transition-colors
          "
        >
          <span className="text-muted-foreground">Sort</span>
          <span className="text-foreground">{sortLabel}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {/* Optional Filters – can be hidden for now if not needed */}
        {onFiltersClick && (
          <button
            type="button"
            onClick={onFiltersClick}
            className="
              hidden sm:inline-flex
              items-center gap-1.5
              rounded-full
              px-3 py-1.5
              text-xs font-medium
              bg-background
              border border-border/60
              shadow-sm
              hover:bg-slate-50
              transition-colors
            "
          >
            <span className="text-foreground">Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
