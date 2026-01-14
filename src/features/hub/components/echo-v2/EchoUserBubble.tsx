/**
 * EchoUserBubble - Compact right-aligned user message
 * Uses slate tones to match Hub aesthetic
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed shadow-sm"
        style={{ background: '#e2e8f0', color: '#1e293b' }}
      >
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
