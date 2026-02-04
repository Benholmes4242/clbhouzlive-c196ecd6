/**
 * EchoUserBubble - WhatsApp-style right-aligned user message bubble
 * Soft orange background with tail on bottom-right
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] px-4 py-2.5 bg-[#FFF4E6] rounded-[18px] rounded-br-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <p className="text-[15px] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
