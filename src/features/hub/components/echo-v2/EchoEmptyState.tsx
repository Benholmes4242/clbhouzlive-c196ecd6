/**
 * EchoEmptyState - Hero panel with prompt chips for first-use
 * Explicit light glass styling to match Hub sheets
 */

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { HUB_CARD, HUB_CHIP, ECHO_ORANGE } from './echoStyles';
import { cn } from '@/lib/utils';

interface EchoEmptyStateProps {
  onChipClick: (prompt: string) => void;
  onFocusInput: () => void;
}

const PROMPT_CHIPS = [
  { text: "What's the best play from 155y?", row: 1 },
  { text: 'Explain stableford in 20 seconds', row: 1 },
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
    haptic('light');
    onFocusInput();
  };

  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center px-5 pt-4 pb-28"
      style={{ minHeight: '100%' }}
    >
      {/* Hero glass card */}
      <div 
        className={cn(
          "w-full max-w-[340px] rounded-3xl p-6 text-center",
          HUB_CARD
        )}
      >
        {/* Icon badge */}
        <div className="flex justify-center mb-4">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${ECHO_ORANGE}1F 0%, ${ECHO_ORANGE}14 100%)`,
              border: `1px solid ${ECHO_ORANGE}26`,
              boxShadow: `0 4px 16px ${ECHO_ORANGE}1A`,
            }}
          >
            <Sparkles className="w-7 h-7" style={{ color: ECHO_ORANGE }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[20px] font-semibold mb-2 text-slate-900" style={{ letterSpacing: '-0.02em' }}>
          Ask Echo
        </h3>

        {/* Subcopy */}
        <p className="text-[14px] leading-relaxed mb-6 text-slate-600">
          Instant golf answers — distances, rules, course intel, gear, and trip planning.
        </p>

        {/* Prompt chips section */}
        <div className="space-y-2 mb-5">
          {/* Row 1 */}
          <div className="flex flex-wrap justify-center gap-2">
            {PROMPT_CHIPS.filter(c => c.row === 1).map((chip) => (
              <button
                key={chip.text}
                onClick={() => handleChipClick(chip.text)}
                className={cn(HUB_CHIP)}
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
                className={cn(HUB_CHIP)}
              >
                {chip.text}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleCTAClick}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-[14px] font-semibold transition-all active:scale-[0.98] text-white"
          style={{
            background: `linear-gradient(135deg, ${ECHO_ORANGE} 0%, #D97706 100%)`,
            boxShadow: `0 4px 16px ${ECHO_ORANGE}4D`,
          }}
        >
          Start a conversation
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
