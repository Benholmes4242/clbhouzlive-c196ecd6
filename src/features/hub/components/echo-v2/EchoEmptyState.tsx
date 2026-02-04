/**
 * EchoEmptyState - Hero panel with prompt chips for first-use
 * Warm styling to match Hub sheets
 */

import React from 'react';
import { haptic } from '@/utils/haptics';

interface EchoEmptyStateProps {
  onChipClick: (prompt: string) => void;
  onFocusInput: () => void;
}

const PROMPT_CHIPS = [
  "What's the best play from 155y?",
  'Explain stableford scoring',
  'Course tips for Portrush',
  'Build a 3-day NI golf trip',
];

// Echo Orb component - larger version for empty state
function EchoOrbLarge() {
  return (
    <div className="w-16 h-16 rounded-full bg-[#FFBF66] flex items-center justify-center shadow-md">
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
  );
}

export function EchoEmptyState({ onChipClick, onFocusInput }: EchoEmptyStateProps) {
  const handleChipClick = (prompt: string) => {
    haptic('light');
    onChipClick(prompt);
  };

  return (
    <div className="w-full flex justify-center">
      {/* Welcome card */}
      <div className="w-full max-w-[360px] bg-white rounded-[20px] border border-[#F0E6DC] p-6 shadow-sm">
        
        {/* Central orb */}
        <div className="flex justify-center mb-5">
          <EchoOrbLarge />
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
          {PROMPT_CHIPS.map((prompt, index) => (
            <button 
              key={index}
              onClick={() => handleChipClick(prompt)}
              className="w-full py-3 px-4 bg-[#FFFAF5] hover:bg-[#FFF5EC] border border-[#F0E6DC] rounded-[12px] text-[15px] text-[#1D1D1F] text-left transition-colors duration-150 active:scale-[0.98]"
            >
              {prompt}
            </button>
          ))}
        </div>
        
      </div>
    </div>
  );
}
