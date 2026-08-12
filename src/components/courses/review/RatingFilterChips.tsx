import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// Tier-only labels (no numeric ranges) — labels resolved via t() at render time
const FILTER_OPTIONS: { key: ScoreTier | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'review.filter.optionAll' },
  { key: 'exceptional', labelKey: 'review.filter.optionExceptional' },
  { key: 'excellent', labelKey: 'review.filter.optionExcellent' },
  { key: 'good', labelKey: 'review.filter.optionGood' },
  { key: 'fair', labelKey: 'review.filter.optionFair' },
  { key: 'poor', labelKey: 'review.filter.optionPoor' },
];

export const RatingFilterChips: React.FC<RatingFilterChipsProps> = ({
  value,
  onChange,
  counts = {},
}) => {
  const { t } = useTranslation('courses');
  const [open, setOpen] = useState(false);

  const activeLabel =
    value === null
      ? null
      : (() => {
          const opt = FILTER_OPTIONS.find((o) => o.key === value);
          return opt ? t(opt.labelKey) : null;
        })();

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
        aria-label={activeLabel ? t('review.filter.buttonLabel', { label: activeLabel }) : t('review.filter.buttonLabelDefault')}
        className="h-auto py-1 px-2 text-xs"
      >
        <Filter className="h-3 w-3 mr-1" />
        {activeLabel || t('review.filter.button')}
        {activeLabel ? (
          <span
            role="button"
            aria-label={t('review.filter.clear')}
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
              fontWeight: 700,
              color: '#0F172A',
              textAlign: 'left',
              margin: 0,
            }}
          >
            {t('review.filter.title')}
          </h2>
        </div>

        <div role="radiogroup" aria-label={t('review.filter.buttonLabelDefault')} style={{ paddingBottom: 12 }}>
          {FILTER_OPTIONS.map((option) => {
            const isActive =
              option.key === 'all' ? value === null : value === option.key;
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
                <span>{t(option.labelKey)}</span>
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
