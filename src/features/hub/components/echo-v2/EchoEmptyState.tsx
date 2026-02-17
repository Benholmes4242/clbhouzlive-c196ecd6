/**
 * EchoEmptyState - Welcome card with prompt suggestions
 * Warm glass card with orange accents
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
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
      <div 
        className="rounded-[20px] p-6"
        style={{
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {/* Central orb */}
        <div className="flex justify-center mb-5">
          <div style={{ filter: 'drop-shadow(0 4px 20px rgba(234,88,12,0.2))' }}>
            <EchoOrb size="lg" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-[24px] font-bold text-center mb-2" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
          Ask Echo
        </h2>
        
        {/* Description */}
        <p className="text-[14px] text-center mb-6 mx-auto max-w-[280px]" style={{ color: '#78716C', lineHeight: 1.5 }}>
          Your personal caddie — distances, rules, course intel, gear, and trip planning.
        </p>

        {/* Suggestion prompts */}
        <div className="flex flex-col gap-2">
          {PROMPT_SUGGESTIONS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleChipClick(prompt)}
              className="w-full py-3 px-4 rounded-[12px] text-[13px] font-medium text-left transition-all duration-150 active:scale-[0.98] flex items-center justify-between gap-2"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(0,0,0,0.07)',
                color: '#44403C',
              }}
            >
              <span>{prompt}</span>
              <ChevronRight className="w-[14px] h-[14px] flex-shrink-0" style={{ color: '#A8A29E' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
