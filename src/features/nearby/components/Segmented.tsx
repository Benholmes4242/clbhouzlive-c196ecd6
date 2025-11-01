import React from 'react';
import './Segmented.css';

export type SegmentItem = { 
  value: string | number; 
  label: string; 
  disabled?: boolean; 
  ariaLabel?: string 
};

type Props = {
  items: SegmentItem[];
  value: string | number | null;
  onChange: (val: string | number) => void;
  columns?: number;
  ariaLabel?: string;
  className?: string;
};

export function Segmented({ 
  items, 
  value, 
  onChange, 
  columns, 
  ariaLabel = 'Options', 
  className = '' 
}: Props) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`segRow ${className}`}
      style={columns ? { gridTemplateColumns: `repeat(${columns},1fr)` } : undefined}
    >
      {items.map(it => {
        const active = value === it.value;
        return (
          <button
            key={String(it.value)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={it.ariaLabel ?? it.label}
            disabled={it.disabled}
            className={`seg ${active ? 'is-active' : ''}`}
            onClick={() => { 
              onChange(it.value); 
              (navigator as any)?.vibrate?.(6); 
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
