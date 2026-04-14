/**
 * EchoThinkingCard - Typing indicator bubble (light dispatch theme)
 */

import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';

export function EchoThinkingCard() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="flex justify-start gap-2 items-start" role="status" aria-label="Echo is thinking">
      <div
        className="flex-shrink-0 mt-1 flex items-center justify-center"
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: 'linear-gradient(135deg, #F7931E, #e07d0a)',
        }}
      >
        <AnimatedEchoWave size={14} active={true} />
      </div>

      <div
        className="px-4 py-3 rounded-[4px_18px_18px_18px] border"
        style={{
          background: '#ffffff',
          borderColor: 'rgba(15,23,42,0.07)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-[5px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-[6px] h-[6px] rounded-full ${
                prefersReduced ? 'opacity-70' : 'animate-bounce'
              }`}
              style={
                prefersReduced
                  ? { opacity: 0.7, background: '#F7931E' }
                  : {
                      opacity: 0.7,
                      background: '#F7931E',
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.8s',
                    }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
