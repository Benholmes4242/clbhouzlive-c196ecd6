/**
 * EchoUserBubble - Right-aligned user message bubble
 * Glass white with orange-tinted border
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end" role="listitem">
      <div 
        className="max-w-[80%] px-[15px] py-[11px] rounded-[16px_16px_4px_16px] backdrop-blur-[12px]"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(234,88,12,0.08)',
          boxShadow: '0 1px 5px rgba(249,115,22,0.05)',
        }}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap select-text" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
          {content}
        </p>
      </div>
    </div>
  );
}
