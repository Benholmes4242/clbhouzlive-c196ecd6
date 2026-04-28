/**
 * EchoUserBubble - Right-aligned user message bubble (light dispatch theme)
 */

import React from 'react';

interface EchoUserBubbleProps {
  content: string;
}

export function EchoUserBubble({ content }: EchoUserBubbleProps) {
  return (
    <div className="flex justify-end" role="listitem">
      <div
        style={{
          maxWidth: '82%',
          padding: '9px 13px',
          borderRadius: '16px 16px 4px 16px',
          background: 'rgba(247,147,30,0.12)',
          border: '1px solid rgba(247,147,30,0.30)',
        }}
      >
        <p
          className="text-[14px] leading-relaxed whitespace-pre-wrap select-text"
          style={{ color: '#1e293b', margin: 0 }}
        >
          {content}
        </p>
      </div>
    </div>
  );
}
