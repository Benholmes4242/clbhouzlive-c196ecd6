/**
 * EchoThinkingCard - Typing indicator bubble (light dispatch theme)
 *
 * Visual parity with EchoResponseCard: 36×36 avatar wrapper with subtle
 * amber radial glow halo + 28×28 squircle amber gradient inside.
 */

import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';

export function EchoThinkingCard() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="flex justify-start gap-2 items-start" role="status" aria-label="Echo is thinking">
      {/* Avatar with subtle ambient glow (matches EchoResponseCard) */}
      <div
        className="flex-shrink-0 mt-1 flex items-center justify-center relative"
        style={{ width: 36, height: 36 }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle, rgba(247,147,30,0.18) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #F7931E, #e07d0a)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <AnimatedEchoWave size={14} active={true} />
        </div>
      </div>

      {/* Bubble — matches EchoResponseCard shadow + border */}
      <div
        className="px-4 py-3 rounded-[4px_18px_18px_18px] border"
        style={{
          background: '#ffffff',
          borderColor: 'rgba(15,23,42,0.07)',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
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
