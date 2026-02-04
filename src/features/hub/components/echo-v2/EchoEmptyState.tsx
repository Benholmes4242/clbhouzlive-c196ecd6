/**
 * EchoEmptyState - Welcome card with prompt suggestions
 * White card with orange accents - polished version
 */

import React from 'react';
import { haptic } from '@/utils/haptics';
import { EchoOrb } from './EchoOrb';

interface EchoEmptyStateProps {
  onChipClick: (prompt: string) => void;
  onFocusInput: () => void;
}

const PROMPT_SUGGESTIONS = [
  "What's the best play from 155y?",
  'Explain stableford scoring',
  'Course tips for Portrush',
  'Build a 3-day NI golf trip',
];

export function EchoEmptyState({ onChipClick, onFocusInput }: EchoEmptyStateProps) {
  const handleChipClick = (prompt: string) => {
    haptic('light');
    onChipClick(prompt);
  };

  return (
    <div className="w-full flex-1 px-5 pb-4 overflow-auto">
      {/* Welcome card */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-sm">
        {/* Central orb - slightly larger */}
        <div className="flex justify-center mb-5">
          <EchoOrb size="lg" />
        </div>

        {/* Title */}
        <h2 className="text-[22px] font-bold text-[#1D1D1F] text-center mb-2">
          Ask Echo
        </h2>
        
        {/* Description - with regular hyphen */}
        <p className="text-[15px] text-[#86868B] text-center leading-relaxed mb-6">
          Instant golf answers - distances, rules, course intel, gear, and trip planning.
        </p>

        {/* Suggestion prompts - polished with better spacing */}
        <div className="flex flex-col gap-2.5">
          {PROMPT_SUGGESTIONS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleChipClick(prompt)}
              className="w-full py-3.5 px-4 bg-[#F8FAFC] hover:bg-[#FFF8F2] border border-[#EAECEF] hover:border-[#FFBF66]/40 rounded-[12px] text-[15px] text-[#1D1D1F] text-left transition-all duration-150 active:scale-[0.98]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
