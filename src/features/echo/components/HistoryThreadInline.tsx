/**
 * HistoryThreadInline - Inline thread expansion accordion
 * Renders conversation replay with shared MessageBubble component
 */

import React, { useRef, useLayoutEffect } from 'react';
import { X, ExternalLink, Copy } from 'lucide-react';
import { MessageBubble } from '@/components/ai-chat/MessageBubble';
import { groupMessages } from '@/components/ai-chat/utils/groupMessages';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import { VirtualList } from './virtual/VirtualList';

export interface HistoryThreadInlineProps {
  threadId: string;
  title: string;
  onCollapse: () => void;
  onCopyLink?: () => void;
  onOpenFull?: () => void;
  onDelete?: () => void;
  onHeightChange?: (height: number) => void;
}

export const HistoryThreadInline: React.FC<HistoryThreadInlineProps> = ({
  threadId,
  title,
  onCollapse,
  onCopyLink,
  onOpenFull,
  onHeightChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading, error } = useEchoThreadMessages(threadId);
  const groupedMessages = groupMessages(messages);

  // Report height changes to parent for virtualization
  useLayoutEffect(() => {
    if (containerRef.current && onHeightChange) {
      const height = containerRef.current.offsetHeight;
      onHeightChange(height);
    }
  }, [messages.length, isLoading, error, onHeightChange]);

  return (
    <div
      ref={containerRef}
      className="mt-2 mb-3 ml-1 pl-3 animate-in fade-in slide-in-from-top-2 duration-150"
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
            <button
              onClick={onCopyLink}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--hub-text-dim)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
              aria-label="Copy link"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          
          {onOpenFull && (
            <button
              onClick={onOpenFull}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--hub-text-dim)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
              aria-label="Open full"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--hub-text-dim)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
            aria-label="Collapse"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          maxHeight: 'min(65vh, 600px)',
          borderRadius: '12px',
          background: 'rgba(0,0,0,0.15)',
          padding: '12px',
          position: 'relative',
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
            Couldn't load this conversation.
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

        {!isLoading && !error && groupedMessages.length > 0 && (
          <VirtualList
            count={groupedMessages.length}
            estimateSize={120}
            overscan={2}
            className="h-full"
            render={(index) => {
              const msg = groupedMessages[index];
              return (
                <div className="mb-3">
                  <MessageBubble
                    key={msg.id}
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
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
