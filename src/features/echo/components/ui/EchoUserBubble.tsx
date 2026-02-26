/**
 * EchoUserBubble - Right-aligned user message bubble
 * Glass white with orange-tinted border
 * Relocated from features/hub/components/echo-v2/
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end" role="listitem">
      <div 
        className="max-w-[80%] px-4 py-3 rounded-[16px_16px_4px_16px] bg-amber-100/80"
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap select-text" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
          {content}
        </p>
      </div>
    </div>
  );
}