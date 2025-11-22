/**
 * Echo Typing Indicator
 * Displays animated dots when Echo is thinking
 */

import React from 'react';
import EchoAvatar from '@/components/ai-chat/EchoAvatar';

export function EchoTypingRow() {
  return (
    <div className="flex justify-start mt-3 translate-y-[2px]">
      <div className="max-w-[70%] flex items-start gap-3">
        {/* Echo avatar */}
        <div className="flex-shrink-0">
          <EchoAvatar state="processing" size={42} />
        </div>

        <div className="echo-card px-3 py-2 flex items-center gap-1.5 w-[72px] justify-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full bg-white/60 animate-[echo-typing_1.1s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
