/**
 * HistoryThreadInline - Inline thread expansion accordion
 * Renders conversation replay with shared MessageBubble component
 */

import React, { useRef, useLayoutEffect } from 'react';
import { X, ExternalLink, Copy } from 'lucide-react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import { useAutoHeight } from '@/lib/ui/useAutoHeight';

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
  const isOpen = true; // This component only mounts when expanded
  const { ref: autoHeightRef, height } = useAutoHeight(isOpen);

  // Report height changes to parent for virtualization
  useLayoutEffect(() => {
    if (containerRef.current && onHeightChange) {
      const height = containerRef.current.offsetHeight;
      onHeightChange(height);
    }
  }, [messages.length, isLoading, error, onHeightChange]);

  return (
    <div
      id={`thread-panel-${threadId}`}
      className="eh-panel"
      style={{ height }}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Echo conversation thread"
    >
      <div ref={autoHeightRef}>
        <div ref={containerRef} className="overflow-hidden">
        {/* Separator */}
        <div 
          className="mb-3 mt-2"
          style={{ borderTop: '1px solid var(--hub-stroke)' }}
        />
        
        {/* Mini header */}
        <div className="eh-miniheader">
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
              aria-label="Close inline preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline messages: plain text log, no bubbles */}
        <div
          ref={containerRef}
          className="inline-thread max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-black/10 p-12 pt-8 backdrop-blur-sm"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Echo conversation thread"
        >
          {isLoading && (
            <div className="text-white/60 text-sm py-3">Loading conversation…</div>
          )}
          {error && (
            <div className="text-red-400 text-sm py-3">Couldn't load messages.</div>
          )}
          {!isLoading && !error && messages.length === 0 && (
            <div className="text-white/60 text-sm py-3">No messages yet.</div>
          )}

          <ul className="space-y-6">
            {messages.map((m) => (
              <li key={m.id} className="inline-msg">
                <div className="inline-msg-meta">
                  <span className="inline-msg-role">
                    {m.role === 'user' ? 'You' : 'Echo'}
                  </span>
                  <span className="inline-msg-dot">•</span>
                  <time className="inline-msg-time">
                    {new Date(m.created_at).toLocaleString()}
                  </time>
                </div>
                <div
                  className={`inline-msg-text ${
                    m.role === 'user' ? 'is-user' : 'is-assistant'
                  }`}
                >
                  {m.content}
                </div>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
};
