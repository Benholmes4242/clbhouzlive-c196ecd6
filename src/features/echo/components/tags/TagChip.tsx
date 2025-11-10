import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagChipProps {
  label: string;
  onRemove?: () => void;
  variant?: 'solid' | 'outline';
  className?: string;
}

export function TagChip({ label, onRemove, variant = 'outline', className }: TagChipProps) {
  const maxLength = 24;
  const displayLabel = label.length > maxLength ? label.slice(0, maxLength) + '...' : label;
  const title = label.length > maxLength ? label : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variant === 'solid' && "bg-primary/10 text-primary hover:bg-primary/15",
        variant === 'outline' && "bg-white/5 border border-white/10 text-foreground hover:bg-white/8 hover:border-white/15",
        className
      )}
      title={title}
    >
      <span>{displayLabel}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-0.5"
          aria-label={`Remove tag ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
