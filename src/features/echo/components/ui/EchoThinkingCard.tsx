/**
 * EchoThinkingCard - Typing indicator bubble
 */

import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export function EchoThinkingCard() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="flex justify-start" role="status" aria-label="Echo is thinking">
      <div
        className="px-4 py-3 rounded-[4px_18px_18px_18px] border"
        style={{
          background: 'hsl(var(--background))',
          borderColor: 'hsl(var(--border))',
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
