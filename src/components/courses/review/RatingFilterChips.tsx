import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScoreTier } from '@/utils/getScoreTier';

export type RatingFilterValue = ScoreTier | null;

interface RatingFilterChipsProps {
  value: RatingFilterValue;
  onChange: (value: RatingFilterValue) => void;
  /** Count of reviews per tier — for showing N next to each option. Key 'all' = total. */
  counts?: Partial<Record<ScoreTier | 'all', number>>;
}

const FILTER_OPTIONS: { key: ScoreTier | 'all'; label: string }[] = [
  { key: 'all', label: 'All ratings' },
  { key: 'exceptional', label: 'Exceptional 9–10' },
  { key: 'excellent', label: 'Excellent 7.5–8.9' },
  { key: 'good', label: 'Good 6–7.4' },
  { key: 'fair', label: 'Fair 4–5.9' },
  { key: 'poor', label: 'Poor < 4' },
];

export const RatingFilterChips: React.FC<RatingFilterChipsProps> = ({
  value,
  onChange,
  counts = {},
}) => {
  const [open, setOpen] = useState(false);

  const activeLabel =
    value === null
      ? null
      : FILTER_OPTIONS.find((o) => o.key === value)?.label ?? null;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleSelect = (key: ScoreTier | 'all') => {
    onChange(key === 'all' ? null : (key as ScoreTier));
    setOpen(false);
  };

  const triggerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 999,
    background: activeLabel ? '#F7931E' : '#0F172A',
    color: '#fff',
    fontSize: 11.5,
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={activeLabel ? `Filter: ${activeLabel}. Tap to change.` : 'Filter reviews by rating'}
        style={triggerStyle}
      >
        <Filter className="w-3 h-3" />
        <span>{activeLabel || 'Filter'}</span>
        {activeLabel ? (
          <span
            role="button"
            aria-label="Clear filter"
            onClick={handleClear}
            style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2 }}
          >
            <X className="w-3 h-3" />
          </span>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="bg-white p-0 rounded-t-2xl border-t border-[rgba(15,23,42,0.08)]"
        >
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#0F172A',
                textAlign: 'left',
              }}
            >
              Filter by rating
            </SheetTitle>
          </SheetHeader>

          <div role="radiogroup" aria-label="Filter reviews by rating" style={{ paddingBottom: 12 }}>
            {FILTER_OPTIONS.map((option) => {
              const isActive =
                option.key === 'all' ? value === null : value === option.key;
              const count = counts[option.key] ?? 0;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleSelect(option.key)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isActive ? 'rgba(247,147,30,0.06)' : 'transparent',
                    border: 'none',
                    borderTop: '0.5px solid rgba(15,23,42,0.07)',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#F7931E' : '#0F172A',
                    textAlign: 'left',
                  }}
                >
                  <span>{option.label}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? '#F7931E' : '#94A3B8',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
