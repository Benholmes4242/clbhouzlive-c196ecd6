/**
 * HistoryThreadInline - Inline thread expansion accordion
 * Renders conversation replay with shared MessageBubble component
 */

import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, Copy } from 'lucide-react';
import { MessageBubble } from '@/components/ai-chat/MessageBubble';
import { groupMessages } from '@/components/ai-chat/utils/groupMessages';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import { TapButton } from '@/components/ui/TapButton';
import { useVirtualizedList } from '@/hooks/useVirtualizedList';

export interface HistoryThreadInlineProps {
  threadId: string;
  title: string;
  onCollapse: () => void;
  onCopyLink?: () => void;
  onOpenFull?: () => void;
  onDelete?: () => void;
}

export const HistoryThreadInline: React.FC<HistoryThreadInlineProps> = ({
  threadId,
  title,
  onCollapse,
  onCopyLink,
  onOpenFull,
  onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading, error } = useEchoThreadMessages(threadId);
  const groupedMessages = groupMessages(messages);

  // Estimate item height for virtualization (average bubble height ~80px)
  const estimatedItemHeight = 80;
  const containerHeight = Math.min(window.innerHeight * 0.65, 600);

  const {
    visibleItems,
    containerProps,
    innerProps,
  } = useVirtualizedList({
    items: groupedMessages,
    itemHeight: estimatedItemHeight,
    containerHeight,
    overscan: 3,
  });

  // Auto-scroll to bottom on mount
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages.length]);

  return (
    <div
      className="mt-2 mb-3 ml-1 pl-3"
      style={{
        borderLeft: '1px solid var(--hub-stroke)',
      }}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between mb-3 px-2"
        style={{
          background: 'var(--hub-glass-bg)',
          borderRadius: '12px',
          padding: '8px 12px',
          border: '1px solid var(--hub-stroke)',
        }}
      >
        <div 
          className="text-[14px] font-medium truncate flex-1"
          style={{ color: 'var(--hub-text)' }}
        >
          {title}
        </div>

        <div className="flex items-center gap-1">
          {onCopyLink && (
            <TapButton
              onPointerDown={onCopyLink}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--hub-text-dim)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
              aria-label="Copy link"
            >
              <Copy className="w-4 h-4" />
            </TapButton>
          )}
          
          {onOpenFull && (
            <TapButton
              onPointerDown={onOpenFull}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--hub-text-dim)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
              aria-label="Open full"
            >
              <ExternalLink className="w-4 h-4" />
            </TapButton>
          )}

          <TapButton
            onPointerDown={onCollapse}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--hub-text-dim)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
            aria-label="Collapse"
          >
            <X className="w-4 h-4" />
          </TapButton>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        {...containerProps}
        className="overflow-y-auto no-scrollbar"
        style={{
          ...containerProps.style,
          borderRadius: '12px',
          background: 'rgba(0,0,0,0.15)',
          padding: '12px',
        }}
      >
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-[18px] animate-pulse"
                style={{ background: 'var(--hub-glass-bg)' }}
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div
            className="text-center py-8 text-[15px]"
            style={{ color: 'var(--hub-text-dim)' }}
          >
            Couldn't load messages. Please try again.
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div
            className="text-center py-8 text-[15px]"
            style={{ color: 'var(--hub-text-dim)' }}
          >
            No messages in this conversation yet.
          </div>
        )}

        {!isLoading && !error && messages.length > 0 && (
          <div {...innerProps}>
            <div className="space-y-3">
              {visibleItems.map(({ item: msg, index, style }) => (
                <div key={msg.id} style={style}>
                  <MessageBubble
                    role={msg.role as 'user' | 'assistant'}
                    content={msg.content}
                    timestamp={msg.created_at}
                    firstInGroup={msg.firstInGroup}
                    lastInGroup={msg.lastInGroup}
                    readOnly={true}
                    showChips={msg.firstInGroup}
                    maxWidth="desktop"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
