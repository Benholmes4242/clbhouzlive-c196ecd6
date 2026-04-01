/**
 * EchoUserBubble - Right-aligned user message bubble (dark theme)
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end" role="listitem">
      <div
        className="max-w-[82%] px-4 py-3 rounded-[18px_18px_4px_18px]"
        style={{
          background: 'rgba(247,147,30,0.14)',
          border: '1px solid rgba(247,147,30,0.26)',
        }}
      >
        <p
          className="text-[14px] leading-relaxed whitespace-pre-wrap select-text"
          style={{ color: 'rgba(255,255,255,0.90)' }}
        >
          {content}
        </p>
      </div>
    </div>
  );
}