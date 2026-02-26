/**
 * EchoThinkingCard - Typing indicator bubble
 * Matches Echo response bubble styling with pulsing orange dots
 * Relocated from features/hub/components/echo-v2/
 */

import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export function EchoThinkingCard() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="flex justify-start" role="status" aria-label="Echo is thinking">
      <div 
        className="px-4 py-3 rounded-2xl backdrop-blur-sm bg-white/70 border border-amber-200/20"
      >
        {/* Animated typing indicator - three pulsing dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-[7px] h-[7px] rounded-full ${prefersReduced ? '' : 'animate-bounce'}`}
              style={{
                background: '#F59E0B',
                ...(prefersReduced ? { opacity: 0.7 } : {
                  opacity: 0.7,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '0.8s',
                }),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}