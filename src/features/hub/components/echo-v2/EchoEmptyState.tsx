/**
 * EchoEmptyState - Hero panel with prompt chips for first-use
 * Polished glass styling with proper vertical distribution
 */

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { HUB_CARD, HUB_CHIP, ECHO_ORANGE, ECHO_ORANGE_DARK } from './echoStyles';
import { cn } from '@/lib/utils';

interface EchoEmptyStateProps {
  onChipClick: (prompt: string) => void;
  onFocusInput: () => void;
}

const PROMPT_CHIPS = [
  { text: "What's the best play from 155y?", row: 1 },
  { text: 'Explain stableford quickly', row: 1 },
  { text: 'How far does Rory hit a 5 iron?', row: 2 },
  { text: 'Course tips for Portrush', row: 2 },
  { text: 'Build a 3-day NI golf trip', row: 2 },
];

export function EchoEmptyState({ onChipClick, onFocusInput }: EchoEmptyStateProps) {
  const handleChipClick = (prompt: string) => {
    haptic('light');
    onChipClick(prompt);
  };

  const handleCTAClick = () => {
    haptic('medium');
    onFocusInput();
  };

  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center px-5 py-8"
      style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Hero glass card */}
      <div 
        className={cn(
          "w-full max-w-[360px] rounded-3xl p-7 text-center",
          HUB_CARD
        )}
        style={{
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {/* Icon badge with subtle glow */}
        <div className="flex justify-center mb-5">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center relative"
            style={{ 
              background: `linear-gradient(145deg, ${ECHO_ORANGE}20 0%, ${ECHO_ORANGE}10 100%)`,
              border: `1.5px solid ${ECHO_ORANGE}28`,
            }}
          >
            {/* Subtle glow ring */}
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                boxShadow: `0 0 20px ${ECHO_ORANGE}20`,
                animationDuration: '2s',
              }}
            />
            <Sparkles className="w-8 h-8 relative z-10" style={{ color: ECHO_ORANGE }} />
          </div>
        </div>

        {/* Title */}
        <h3 
          className="text-[22px] font-semibold mb-2 text-slate-900" 
          style={{ letterSpacing: '-0.025em' }}
        >
          Ask Echo
        </h3>

        {/* Subcopy */}
        <p className="text-[14px] leading-relaxed mb-6 text-slate-500 max-w-[280px] mx-auto">
          Instant golf answers — distances, rules, course intel, gear, and trip planning.
        </p>

        {/* Prompt chips section */}
        <div className="space-y-2.5 mb-6">
          {/* Row 1 */}
          <div className="flex flex-wrap justify-center gap-2">
            {PROMPT_CHIPS.filter(c => c.row === 1).map((chip) => (
              <button
                key={chip.text}
                onClick={() => handleChipClick(chip.text)}
                className={cn(
                  HUB_CHIP,
                  "shadow-sm hover:shadow-md"
                )}
              >
                {chip.text}
              </button>
            ))}
          </div>
          
          {/* Row 2 */}
          <div className="flex flex-wrap justify-center gap-2">
            {PROMPT_CHIPS.filter(c => c.row === 2).map((chip) => (
              <button
                key={chip.text}
                onClick={() => handleChipClick(chip.text)}
                className={cn(
                  HUB_CHIP,
                  "shadow-sm hover:shadow-md"
                )}
              >
                {chip.text}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA with gradient and shadow */}
        <button
          onClick={handleCTAClick}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98] text-white"
          style={{
            background: `linear-gradient(145deg, ${ECHO_ORANGE} 0%, ${ECHO_ORANGE_DARK} 100%)`,
            boxShadow: `0 4px 14px ${ECHO_ORANGE}40, 0 1px 3px rgba(0,0,0,0.1)`,
          }}
        >
          Start a conversation
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
