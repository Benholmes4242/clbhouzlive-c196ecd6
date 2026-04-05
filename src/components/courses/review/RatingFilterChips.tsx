import React from 'react';
import { X } from 'lucide-react';
import { getScoreTier, ScoreTier } from '@/utils/getScoreTier';
import { cn } from '@/lib/utils';

export type RatingFilterValue = ScoreTier | null;

interface RatingFilterChipsProps {
  value: RatingFilterValue;
  onChange: (value: RatingFilterValue) => void;
}

const FILTER_OPTIONS: { key: ScoreTier; label: string; sampleScore: number }[] = [
  { key: 'outstanding', label: 'Outstanding', sampleScore: 9.5 },
  { key: 'excellent', label: 'Excellent', sampleScore: 8.5 },
  { key: 'veryGood', label: 'Very Good', sampleScore: 7.5 },
  { key: 'good', label: 'Good', sampleScore: 6.5 },
  { key: 'fair', label: 'Fair', sampleScore: 5.0 },
];

export const RatingFilterChips: React.FC<RatingFilterChipsProps> = ({
  value,
  onChange,
}) => {
  return (
    <div 
      className="flex flex-wrap items-center justify-center gap-2" 
      role="group" 
      aria-label="Filter reviews by rating"
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(isActive ? null : option.key)}
            className="shrink-0 whitespace-nowrap min-h-[28px] px-2.5 text-xs font-medium transition-colors active:scale-[0.97] flex items-center gap-1"
            style={{
              borderRadius: 20,
              background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
              border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
              color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
            }}
          >
            {option.label}
          </button>
        );
      })}
      
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium
            whitespace-nowrap min-h-[32px] bg-muted text-muted-foreground 
            border border-border hover:bg-muted/80 active:scale-[0.97] transition-all"
          style={{ borderRadius: 8 }}
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
};
