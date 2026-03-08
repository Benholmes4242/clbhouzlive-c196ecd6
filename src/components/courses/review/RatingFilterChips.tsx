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

// Tier-specific color configurations - UNIFIED GRAY/AMBER SYSTEM
// Outstanding uses Amber, everything else uses Gray
const tierConfig: Record<ScoreTier, { 
  bg: string; 
  text: string; 
  activeBg: string; 
  activeText: string;
  border: string;
  activeBorder: string;
}> = {
  outstanding: { 
    bg: 'bg-[#f59e0b]', 
    text: 'text-white', 
    activeBg: 'bg-[#f59e0b]', 
    activeText: 'text-white',
    border: 'border-[#f59e0b]',
    activeBorder: 'border-[#f59e0b]',
  },
  excellent: { 
    bg: 'bg-[#1e293b]/10', 
    text: 'text-[#1e293b]', 
    activeBg: 'bg-[#1e293b]', 
    activeText: 'text-white',
    border: 'border-[#1e293b]/20',
    activeBorder: 'border-[#1e293b]',
  },
  veryGood: { 
    bg: 'bg-[#475569]/10', 
    text: 'text-[#475569]', 
    activeBg: 'bg-[#475569]', 
    activeText: 'text-white',
    border: 'border-[#475569]/20',
    activeBorder: 'border-[#475569]',
  },
  good: { 
    bg: 'bg-[#64748b]/10', 
    text: 'text-[#64748b]', 
    activeBg: 'bg-[#64748b]', 
    activeText: 'text-white',
    border: 'border-[#64748b]/20',
    activeBorder: 'border-[#64748b]',
  },
  fair: { 
    bg: 'bg-[#94a3b8]/10', 
    text: 'text-[#94a3b8]', 
    activeBg: 'bg-[#94a3b8]', 
    activeText: 'text-white',
    border: 'border-[#94a3b8]/20',
    activeBorder: 'border-[#94a3b8]',
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
