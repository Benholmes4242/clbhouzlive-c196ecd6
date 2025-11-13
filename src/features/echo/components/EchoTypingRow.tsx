/**
 * Echo Typing Indicator
 * Displays animated dots when Echo is thinking
 */

import React from 'react';

export function EchoTypingRow() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] flex items-start gap-3">
        {/* Echo icon */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[color:var(--echo-accent)]/20 border border-[color:var(--echo-accent)]/30 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-[color:var(--echo-accent)]">e</span>
        </div>

        <div className="echo-card px-3 py-2 flex items-center gap-1.5 w-[72px] justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 echo-typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 echo-typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 echo-typing-dot" />
        </div>
      </div>
    </div>
  );
}
