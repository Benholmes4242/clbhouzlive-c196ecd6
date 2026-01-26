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

// Tier-specific color configurations - UNIFIED EMERALD/CHARTREUS SYSTEM
// Outstanding uses Chartreus gold, everything else uses Emerald
const tierConfig: Record<ScoreTier, { 
  bg: string; 
  text: string; 
  activeBg: string; 
  activeText: string;
  border: string;
  activeBorder: string;
}> = {
  outstanding: { 
    bg: 'bg-[#C1A84C]', 
    text: 'text-white', 
    activeBg: 'bg-[#C1A84C]', 
    activeText: 'text-white',
    border: 'border-[#C1A84C]',
    activeBorder: 'border-[#C1A84C]',
  },
  excellent: { 
    bg: 'bg-[#334E3D]/10', 
    text: 'text-[#334E3D]', 
    activeBg: 'bg-[#334E3D]', 
    activeText: 'text-white',
    border: 'border-[#334E3D]/20',
    activeBorder: 'border-[#334E3D]',
  },
  veryGood: { 
    bg: 'bg-[#334E3D]/10', 
    text: 'text-[#334E3D]', 
    activeBg: 'bg-[#334E3D]', 
    activeText: 'text-white',
    border: 'border-[#334E3D]/20',
    activeBorder: 'border-[#334E3D]',
  },
  good: { 
    bg: 'bg-[#334E3D]/10', 
    text: 'text-[#334E3D]', 
    activeBg: 'bg-[#334E3D]', 
    activeText: 'text-white',
    border: 'border-[#334E3D]/20',
    activeBorder: 'border-[#334E3D]',
  },
  fair: { 
    bg: 'bg-[#334E3D]/10', 
    text: 'text-[#334E3D]', 
    activeBg: 'bg-[#334E3D]', 
    activeText: 'text-white',
    border: 'border-[#334E3D]/20',
    activeBorder: 'border-[#334E3D]',
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
