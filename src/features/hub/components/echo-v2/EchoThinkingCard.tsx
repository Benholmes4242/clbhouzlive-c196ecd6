/**
 * EchoThinkingCard - Shimmer loading state
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

export function EchoThinkingCard() {
  return (
    <div className="flex gap-2.5">
      {/* Echo avatar */}
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ 
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: '#a855f7' }} />
      </div>

      {/* Thinking card */}
      <div 
        className="flex-1 rounded-2xl rounded-tl-md px-4 py-3"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Shimmer lines */}
        <div className="space-y-2">
          <div 
            className="h-3 rounded-full animate-pulse"
            style={{ 
              background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(168, 85, 247, 0.08) 100%)',
              width: '85%',
            }}
          />
          <div 
            className="h-3 rounded-full animate-pulse"
            style={{ 
              background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(168, 85, 247, 0.08) 100%)',
              width: '65%',
              animationDelay: '0.1s',
            }}
          />
          <div 
            className="h-3 rounded-full animate-pulse"
            style={{ 
              background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(168, 85, 247, 0.08) 100%)',
              width: '45%',
              animationDelay: '0.2s',
            }}
          />
        </div>
        
        {/* Label */}
        <p 
          className="text-[11px] mt-2.5 flex items-center gap-1.5"
          style={{ color: '#a855f7' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Echo is thinking…
        </p>
      </div>
    </div>
  );
}
