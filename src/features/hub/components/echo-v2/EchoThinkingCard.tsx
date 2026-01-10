/**
 * EchoThinkingCard - Shimmer loading state
 * Explicit light styling to match Hub sheets
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { HUB_CARD } from './echoStyles';
import { cn } from '@/lib/utils';

export function EchoThinkingCard() {
  return (
    <div className="flex gap-2.5">
      {/* Echo avatar */}
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--echo-accent, 270 60% 60%) / 0.12) 0%, hsl(var(--echo-accent-dark, 262 83% 58%) / 0.08) 100%)',
          border: '1px solid hsl(var(--echo-accent, 270 60% 60%) / 0.15)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-[hsl(var(--echo-accent,270_60%_60%))]" />
      </div>

      {/* Thinking card */}
      <div 
        className={cn(
          "flex-1 rounded-2xl rounded-tl-md px-4 py-3",
          HUB_CARD
        )}
      >
        {/* Shimmer lines */}
        <div className="space-y-2">
          <div 
            className="h-3 rounded-full animate-pulse"
            style={{ 
              background: 'linear-gradient(90deg, hsl(var(--echo-accent, 270 60% 60%) / 0.08) 0%, hsl(var(--echo-accent, 270 60% 60%) / 0.15) 50%, hsl(var(--echo-accent, 270 60% 60%) / 0.08) 100%)',
              width: '85%',
            }}
          />
          <div 
            className="h-3 rounded-full animate-pulse"
            style={{ 
              background: 'linear-gradient(90deg, hsl(var(--echo-accent, 270 60% 60%) / 0.08) 0%, hsl(var(--echo-accent, 270 60% 60%) / 0.15) 50%, hsl(var(--echo-accent, 270 60% 60%) / 0.08) 100%)',
              width: '65%',
              animationDelay: '0.1s',
            }}
          />
          <div 
            className="h-3 rounded-full animate-pulse"
            style={{ 
              background: 'linear-gradient(90deg, hsl(var(--echo-accent, 270 60% 60%) / 0.08) 0%, hsl(var(--echo-accent, 270 60% 60%) / 0.15) 50%, hsl(var(--echo-accent, 270 60% 60%) / 0.08) 100%)',
              width: '45%',
              animationDelay: '0.2s',
            }}
          />
        </div>
        
        {/* Label */}
        <p className="text-[11px] mt-2.5 flex items-center gap-1.5 text-[hsl(var(--echo-accent,270_60%_60%))]">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Echo is thinking…
        </p>
      </div>
    </div>
  );
}
