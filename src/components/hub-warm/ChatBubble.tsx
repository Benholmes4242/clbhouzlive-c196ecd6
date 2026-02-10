/**
 * ChatBubble — Cleo-style glass bubble for Messages
 * Spec: White/glass on gradient canvas, orange-tinted for own messages
 * border-radius: 18px 18px 4px 18px (own) / 18px 18px 18px 4px (other)
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  children: React.ReactNode;
  isOwn?: boolean;
  className?: string;
}

export function ChatBubble({ children, isOwn = false, className }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        'px-[15px] py-[11px] break-words backdrop-blur-[12px]',
        isOwn
          ? 'rounded-[18px_18px_4px_18px] ml-12'
          : 'rounded-[18px_18px_18px_4px] mr-12',
        className
      )}
      style={
        isOwn
          ? {
              background: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(249,115,22,0.12)',
              boxShadow: '0 1px 6px rgba(249,115,22,0.06)',
            }
          : {
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }
      }
    >
      {children}
    </div>
  );
}
