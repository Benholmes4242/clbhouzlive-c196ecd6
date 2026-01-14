/**
 * EchoEmptyState - Hero panel with prompt chips for first-use
 * Explicit light glass styling to match Hub sheets
 */

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { HUB_CARD, ECHO_ORANGE } from './echoStyles';
import { cn } from '@/lib/utils';

interface EchoEmptyStateProps {
  onChipClick: (prompt: string) => void;
  onFocusInput: () => void;
}

const PROMPT_CHIPS = [
  { text: "What's the best play from 155y?", row: 1 },
  { text: 'Explain stableford scoring', row: 1 },
  { text: 'How far does Rory hit a 5 iron?', row: 2 },
  { text: 'Course tips for Portrush', row: 2 },
  { text: 'Build a 3-day NI golf trip', row: 3 },
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
      className="flex-1 flex flex-col items-center justify-center px-5 pt-6 pb-32"
      style={{ minHeight: '100%' }}
    >
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
              background: `linear-gradient(135deg, ${ECHO_ORANGE}18 0%, ${ECHO_ORANGE}0A 100%)`,
              border: `1.5px solid ${ECHO_ORANGE}20`,
              boxShadow: `0 8px 24px ${ECHO_ORANGE}15`,
            }}
          >
            <Sparkles className="w-8 h-8" style={{ color: ECHO_ORANGE }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[22px] font-semibold mb-2 text-slate-900 tracking-tight">
          Ask Echo
        </h3>

        {/* Subcopy */}
        <p className="text-[14px] leading-relaxed mb-6 text-slate-500 max-w-[280px] mx-auto">
          Instant golf answers — distances, rules, course intel, gear, and trip planning.
        </p>

        {/* Prompt chips section */}
        <div className="space-y-2 mb-6">
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex flex-wrap justify-center gap-2">
              {PROMPT_CHIPS.filter(c => c.row === row).map((chip) => (
                <button
                  key={chip.text}
                  onClick={() => handleChipClick(chip.text)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all active:scale-[0.97] hover:bg-slate-100"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#475569',
                  }}
                >
                  {chip.text}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleCTAClick}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98] text-white"
          style={{
            background: `linear-gradient(135deg, ${ECHO_ORANGE} 0%, #D97706 100%)`,
            boxShadow: `0 4px 16px ${ECHO_ORANGE}40`,
          }}
        >
          Start a conversation
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
