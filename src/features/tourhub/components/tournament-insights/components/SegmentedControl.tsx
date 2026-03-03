/**
 * SegmentedControl - Shared segmented toggle
 * Used by LiveUpcomingToggle and IntelligenceTabSwitcher
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption {
  label: string;
  value: string;
  showLiveDot?: boolean;
  hidden?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, className }) => {
  return (
    <div className={cn("flex items-stretch rounded-xl overflow-hidden bg-transparent", className)}>
      {options.map((option) => {
        if (option.hidden) return null;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98] flex items-center justify-center gap-1.5",
              isActive
                ? "bg-foreground text-background shadow-sm m-1 rounded-lg"
                : "text-muted-foreground hover:text-foreground rounded-lg active:bg-card/50"
            )}
          >
            {option.showLiveDot && (
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{
                  backgroundColor: '#16A34A',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
