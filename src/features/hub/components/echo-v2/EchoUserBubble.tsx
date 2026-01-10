/**
 * EchoUserBubble - Compact right-aligned user message
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
