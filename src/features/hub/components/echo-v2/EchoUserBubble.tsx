/**
 * EchoUserBubble - Right-aligned user message bubble
 * Polished with subtle gradient and shadow
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed"
        style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15), 0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
