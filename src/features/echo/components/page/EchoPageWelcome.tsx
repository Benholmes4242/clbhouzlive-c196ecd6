/**
 * EchoPageWelcome - Full-page welcome state with larger layout
 * Designed to fit within viewport without scrolling
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
];

export function EchoPageWelcome({ onPromptClick, onFocusInput }: EchoPageWelcomeProps) {
  const handleChipClick = (prompt: string) => {
    haptic('light');
    onPromptClick(prompt);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-5 pb-4">
      {/* Orb */}
      <div className="w-16 h-16 rounded-full bg-[#FFBF66] flex items-center justify-center mb-5 shadow-sm">
        <div className="flex items-center gap-[3px]">
          <div 
            className="w-[3px] h-3 bg-white rounded-full" 
            style={{ animation: 'gentleWave 3s ease-in-out infinite' }} 
          />
          <div 
            className="w-[3px] h-5 bg-white rounded-full" 
            style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} 
          />
          <div 
            className="w-[3px] h-3 bg-white rounded-full" 
            style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} 
          />
        </div>
      </div>

      <h1 className="text-[24px] font-bold text-[#1D1D1F] mb-2 text-center">
        Ask Echo
      </h1>
      <p className="text-[15px] text-[#86868B] text-center mb-6 max-w-[280px] leading-relaxed">
        Instant golf answers - distances, rules, course intel, gear, and trip planning.
      </p>

      {/* Prompts - limit to 4 to fit on screen */}
      <div className="w-full max-w-[360px] flex flex-col gap-2.5">
        {PROMPT_SUGGESTIONS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(prompt)}
            className="py-3.5 px-4 bg-white border border-[#E5E5EA] rounded-[14px] text-[15px] text-[#1D1D1F] text-left hover:border-[#FFBF66]/40 hover:bg-[#FFFCFA] transition-all duration-150 active:scale-[0.98] shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
