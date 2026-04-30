import React, { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { ScoreTier } from '@/utils/getScoreTier';

export type RatingFilterValue = ScoreTier | null;

interface RatingFilterChipsProps {
  value: RatingFilterValue;
  onChange: (value: RatingFilterValue) => void;
  /** Count of reviews per tier — for showing N next to each option. Key 'all' = total. */
  counts?: Partial<Record<ScoreTier | 'all', number>>;
}

// Tier-only labels (no numeric ranges)
const FILTER_OPTIONS: { key: ScoreTier | 'all'; label: string }[] = [
  { key: 'all', label: 'All ratings' },
  { key: 'exceptional', label: 'Exceptional' },
  { key: 'excellent', label: 'Excellent' },
  { key: 'good', label: 'Good' },
  { key: 'fair', label: 'Fair' },
  { key: 'poor', label: 'Poor' },
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

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={activeLabel ? `Filter: ${activeLabel}. Tap to change.` : 'Filter reviews by rating'}
        className="h-auto py-1 px-2 text-xs"
      >
        <Filter className="h-3 w-3 mr-1" />
        {activeLabel || 'Filter'}
        {activeLabel ? (
          <span
            role="button"
            aria-label="Clear filter"
            onClick={handleClear}
            className="inline-flex items-center ml-1"
          >
            <X className="h-3 w-3" />
          </span>
        ) : null}
      </Button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledBy="rating-filter-title"
      >
        <div className="px-4 pt-4 pb-2">
          <h2
            id="rating-filter-title"
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#0F172A',
              textAlign: 'left',
              margin: 0,
            }}
          >
            Filter by rating
          </h2>
        </div>

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
                {isActive && (
                  <Check className="h-4 w-4" style={{ color: '#F7931E' }} />
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
};
