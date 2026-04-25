import React from 'react';
import { ScoreTier } from '@/utils/getScoreTier';

export type RatingFilterValue = ScoreTier | null;

interface RatingFilterChipsProps {
  value: RatingFilterValue;
  onChange: (value: RatingFilterValue) => void;
}

const FILTER_OPTIONS: { key: ScoreTier; label: string }[] = [
  { key: 'exceptional', label: 'Exceptional 9–10' },
  { key: 'excellent', label: 'Excellent 7.5–8.9' },
  { key: 'good', label: 'Good 6–7.4' },
];

export const RatingFilterChips: React.FC<RatingFilterChipsProps> = ({
  value,
  onChange,
}) => {
  return (
    <div
      role="group"
      aria-label="Filter reviews by rating"
      className="scrollbar-hide"
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        justifyContent: 'center',
      }}
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(isActive ? null : option.key)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: isActive ? 800 : 600,
              background: isActive ? 'rgba(247,147,30,0.1)' : 'transparent',
              color: isActive ? '#F7931E' : '#94A3B8',
              border: `1px solid ${isActive ? 'rgba(247,147,30,0.3)' : 'rgba(15,23,42,0.08)'}`,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
