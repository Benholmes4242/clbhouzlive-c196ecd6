/**
 * EchoThinkingCard - Typing indicator bubble (dark theme)
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
          background: '#1e1e22',
          borderColor: 'rgba(255,255,255,0.10)',
        }}
      >
        <div className="flex items-center gap-[5px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-[6px] h-[6px] rounded-full bg-[hsl(38,92%,50%)] ${
                prefersReduced ? 'opacity-70' : 'animate-bounce'
              }`}
              style={
                prefersReduced
                  ? { opacity: 0.7 }
                  : {
                      opacity: 0.7,
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