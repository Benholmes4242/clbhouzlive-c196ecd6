import React from 'react';
import { X } from 'lucide-react';
import { getScoreTier, ScoreTier } from '@/utils/getScoreTier';

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
    <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter reviews by rating">
      {FILTER_OPTIONS.map((option) => {
        const isSelected = value === option.key;
        
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(isSelected ? null : option.key)}
            className={`
              inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium
              whitespace-nowrap min-h-[28px] transition-all duration-100
              ${isSelected 
                ? 'bg-slate-900 text-white border border-slate-900' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 active:scale-[0.97]'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
      
      {/* Clear button - only visible when filter is active */}
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium
            whitespace-nowrap min-h-[28px] bg-slate-100 text-slate-600 
            border border-slate-200 hover:bg-slate-200 active:scale-[0.97] transition-all"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
};
