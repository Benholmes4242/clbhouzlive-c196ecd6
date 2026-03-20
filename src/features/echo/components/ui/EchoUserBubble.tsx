/**
 * EchoUserBubble - Right-aligned user message bubble
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
        style={{ background: 'rgba(245, 158, 11, 0.1)' }}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap select-text text-foreground">
          {content}
        </p>
      </div>
    </div>
  );
}
