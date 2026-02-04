/**
 * EchoPageWelcome - Full-page welcome state with larger layout
 */

import React from 'react';
import { haptic } from '@/utils/haptics';
import { EchoOrb } from '@/features/hub/components/echo-v2/EchoOrb';

interface EchoPageWelcomeProps {
  onPromptClick: (prompt: string) => void;
  onFocusInput: () => void;
}

const PROMPT_SUGGESTIONS = [
  "What's the best play from 155y?",
  'Explain stableford scoring',
  'Course tips for Portrush',
  'Build a 3-day NI golf trip',
  'What clubs should I carry?',
  'Golf etiquette tips for beginners',
];

export function EchoPageWelcome({ onPromptClick, onFocusInput }: EchoPageWelcomeProps) {
  const handleChipClick = (prompt: string) => {
    haptic('light');
    onPromptClick(prompt);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
      {/* Large orb */}
      <div className="mb-6">
        <EchoOrb size="xl" />
      </div>

      <h1 className="text-[28px] font-bold text-[#1D1D1F] mb-2 text-center">
        Ask Echo
      </h1>
      <p className="text-[16px] text-[#86868B] text-center mb-8 max-w-[300px] leading-relaxed">
        Instant golf answers - distances, rules, course intel, gear, and trip planning.
      </p>

      {/* Prompt suggestions - grid on larger screens */}
      <div className="w-full max-w-[440px] grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROMPT_SUGGESTIONS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(prompt)}
            className="p-4 bg-white border border-[#E5E5EA] rounded-[14px] text-[15px] text-[#1D1D1F] text-left hover:border-[#FFBF66]/40 hover:bg-[#FFFCFA] transition-all duration-150 active:scale-[0.98] shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
