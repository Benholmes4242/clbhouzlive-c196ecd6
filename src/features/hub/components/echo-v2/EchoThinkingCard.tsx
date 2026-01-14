/**
 * EchoThinkingCard - "Echo is thinking" state with animated indicator
 * Shows while waiting for first token to arrive
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { HUB_CARD, ECHO_ORANGE } from './echoStyles';
import { cn } from '@/lib/utils';

export function EchoThinkingCard() {
  return (
    <div className="flex gap-2.5">
      {/* Echo avatar */}
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ 
          background: `linear-gradient(135deg, ${ECHO_ORANGE}20 0%, ${ECHO_ORANGE}10 100%)`,
          border: `1.5px solid ${ECHO_ORANGE}25`,
        }}
      >
        <Sparkles className="w-4 h-4 animate-pulse" style={{ color: ECHO_ORANGE }} />
      </div>

      {/* Thinking card */}
      <div 
        className={cn(
          "flex-1 rounded-2xl rounded-tl-md px-4 py-3.5",
          HUB_CARD
        )}
      >
        {/* Animated typing indicator */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: ECHO_ORANGE,
                  opacity: 0.7,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
          <span 
            className="text-[13px] font-medium ml-2"
            style={{ color: ECHO_ORANGE }}
          >
            Echo is thinking…
          </span>
        </div>
      </div>
    </div>
  );
}
