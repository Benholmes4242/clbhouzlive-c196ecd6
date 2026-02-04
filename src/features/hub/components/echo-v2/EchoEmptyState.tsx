/**
 * EchoEmptyState - Welcome card with prompt suggestions
 * White card with orange accents
 */

import React from 'react';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { HUB_CARD, HOVER_ORANGE_TINT, HOVER_ORANGE_BORDER } from './echoStyles';
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
    <div className="w-full flex justify-center px-5">
      {/* Welcome card */}
      <div 
        className={cn(
          "w-full max-w-[360px] rounded-[20px] p-6",
          HUB_CARD
        )}
      >
        {/* Central orb */}
        <div className="flex justify-center mb-5">
          <EchoOrb size="xl" />
        </div>

        {/* Title & description */}
        <h2 className="text-[22px] font-bold text-[#1D1D1F] text-center mb-2">
          Ask Echo
        </h2>
        <p className="text-[15px] text-[#86868B] text-center leading-relaxed mb-6">
          Instant golf answers — distances, rules, course intel, gear, and trip planning.
        </p>

        {/* Suggestion prompts */}
        <div className="flex flex-col gap-2">
          {PROMPT_SUGGESTIONS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleChipClick(prompt)}
              className="w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E5EA] rounded-[12px] text-[15px] text-[#1D1D1F] text-left transition-all duration-150 active:scale-[0.98]"
              style={{
                // Inline styles for hover states that need to be dynamic
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = HOVER_ORANGE_TINT;
                e.currentTarget.style.borderColor = HOVER_ORANGE_BORDER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#E5E5EA';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
