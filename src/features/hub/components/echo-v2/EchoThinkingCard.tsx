/**
 * EchoThinkingCard - WhatsApp-style "typing" indicator bubble
 * Shows while waiting for first token to arrive
 */

import React from 'react';

export function EchoThinkingCard() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 bg-white rounded-[18px] rounded-bl-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        {/* Animated typing indicator - three bouncing dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#FFBF66] animate-bounce"
              style={{
                opacity: 0.7,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
