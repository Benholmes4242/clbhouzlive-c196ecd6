/**
 * EchoEmptyState - Hero panel with prompt chips for first-use
 * Explicit light glass styling to match Hub sheets
 */

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { HUB_CARD, ECHO_GRADIENT, ECHO_BORDER, ECHO_GLOW } from './echoStyles';
import { cn } from '@/lib/utils';

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

export function EchoEmptyState({ onChipClick, onFocusInput }: EchoEmptyStateProps) {
  const handleChipClick = (prompt: string) => {
    haptic('light');
    onChipClick(prompt);
  };

  const handleCTAClick = () => {
    haptic('light');
    onFocusInput();
  };

  return (
    <div className="w-full flex justify-center">
      {/* Hero glass card */}
      <div 
        className={cn(
          "w-full max-w-[360px] rounded-3xl p-6 text-center",
          HUB_CARD
        )}
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {/* Icon badge */}
        <div className="flex justify-center mb-5">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ 
              background: ECHO_GRADIENT,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: `1.5px solid ${ECHO_BORDER}`,
              boxShadow: ECHO_GLOW,
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[22px] font-semibold mb-2 text-slate-800 tracking-tight">
          Ask Echo
        </h3>

        {/* Subcopy */}
        <p className="text-[14px] leading-relaxed mb-6 text-slate-800 max-w-[280px] mx-auto">
          Instant golf answers – distances, rules, course intel, gear, and trip planning.
        </p>

        {/* Prompt chips - single row */}
        <div className="flex flex-wrap justify-center gap-2">
          {PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all active:scale-[0.97] hover:bg-slate-100"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: '#1e293b',
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
