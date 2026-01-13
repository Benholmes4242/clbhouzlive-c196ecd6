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

// Tier-specific color configurations - UNIFIED SYSTEM
// Outstanding uses amber, everything else uses grey
const tierConfig: Record<ScoreTier, { 
  bg: string; 
  text: string; 
  activeBg: string; 
  activeText: string;
  border: string;
  activeBorder: string;
}> = {
  outstanding: { 
    bg: 'bg-gradient-to-r from-[#FFAF30] to-[#F79E1B]', 
    text: 'text-white', 
    activeBg: 'bg-gradient-to-r from-[#E8890F] to-[#D47A00]', 
    activeText: 'text-white',
    border: 'border-[#F79E1B]',
    activeBorder: 'border-[#E8890F]',
  },
  excellent: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-600', 
    activeBg: 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]', 
    activeText: 'text-gray-700',
    border: 'border-gray-200',
    activeBorder: 'border-[#9ca3af]',
  },
  veryGood: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-600', 
    activeBg: 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]', 
    activeText: 'text-gray-700',
    border: 'border-gray-200',
    activeBorder: 'border-[#9ca3af]',
  },
  good: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-600', 
    activeBg: 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]', 
    activeText: 'text-gray-700',
    border: 'border-gray-200',
    activeBorder: 'border-[#9ca3af]',
  },
  fair: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-600', 
    activeBg: 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]', 
    activeText: 'text-gray-700',
    border: 'border-gray-200',
    activeBorder: 'border-[#9ca3af]',
  },
};

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
        const isSelected = value === option.key;
        const config = tierConfig[option.key];
        
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(isSelected ? null : option.key)}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium",
              "whitespace-nowrap min-h-[32px] transition-all duration-150 border",
              "active:scale-[0.97]",
              isSelected 
                ? `${config.activeBg} ${config.activeText} ${config.activeBorder}` 
                : `${config.bg} ${config.text} ${config.border} hover:opacity-80`
            )}
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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium
            whitespace-nowrap min-h-[32px] bg-gray-100 text-gray-600 
            border border-gray-200 hover:bg-gray-200 active:scale-[0.97] transition-all"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
};
