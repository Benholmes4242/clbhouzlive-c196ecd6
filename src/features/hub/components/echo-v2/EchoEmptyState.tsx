/**
 * EchoEmptyState - Hero panel with prompt chips for first-use
 */

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';

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
        className="w-full max-w-[340px] rounded-3xl p-6 text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Icon badge */}
        <div className="flex justify-center mb-4">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              boxShadow: '0 4px 16px rgba(168, 85, 247, 0.1)',
            }}
          >
            <Sparkles className="w-7 h-7" style={{ color: '#a855f7' }} />
          </div>
        </div>

        {/* Title */}
        <h3 
          className="text-[20px] font-semibold mb-2"
          style={{ color: '#1e293b', letterSpacing: '-0.02em' }}
        >
          Ask Echo
        </h3>

        {/* Subcopy */}
        <p 
          className="text-[14px] leading-relaxed mb-6"
          style={{ color: '#64748b' }}
        >
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
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all active:scale-95"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#64748b',
                }}
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
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all active:scale-95"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#64748b',
                }}
              >
                {chip.text}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleCTAClick}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-[14px] font-semibold transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
          }}
        >
          Start a conversation
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
