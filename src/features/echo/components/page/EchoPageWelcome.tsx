/**
 * EchoPageWelcome - Apple-grade welcome state with glowing orb
 * Designed to fit within viewport without scrolling
 */

import React from 'react';
import { haptic } from '@/utils/haptics';

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
    <div className="h-full flex flex-col items-center justify-center px-5">
      {/* Orb with glow */}
      <div className="relative mb-6">
        {/* Glow layer */}
        <div 
          className="absolute inset-0 rounded-full bg-[#FFBF66] blur-2xl opacity-30 scale-[2]"
          style={{ animation: 'glowPulse 4s ease-in-out infinite' }}
        />
        
        {/* Main orb */}
        <div className="relative w-20 h-20 rounded-full bg-[#FFBF66] flex items-center justify-center shadow-lg">
          {/* Soundwave bars */}
          <div className="flex items-center gap-1">
            <div 
              className="w-1 h-4 bg-white rounded-full" 
              style={{ animation: 'gentleWave 3s ease-in-out infinite' }} 
            />
            <div 
              className="w-1 h-6 bg-white rounded-full" 
              style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} 
            />
            <div 
              className="w-1 h-4 bg-white rounded-full" 
              style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} 
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight mb-2">
        Ask Echo
      </h1>
      
      {/* Subtitle */}
      <p className="text-[15px] text-[#86868B] text-center leading-relaxed mb-8 max-w-[260px]">
        Instant golf answers - distances, rules, course intel, gear, and trip planning.
      </p>

      {/* Prompt buttons - Apple-style cards */}
      <div className="w-full max-w-[340px] flex flex-col gap-3">
        {PROMPT_SUGGESTIONS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(prompt)}
            className="py-4 px-5 bg-white border border-[#E8E8ED] rounded-2xl text-[15px] text-[#1D1D1F] text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-[#FFBF66]/50 active:scale-[0.98] transition-all duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
