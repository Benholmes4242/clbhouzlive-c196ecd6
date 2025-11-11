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
    >
      <div ref={autoHeightRef}>
        <div ref={containerRef}>

          {/* Inline messages: plain text log, no bubbles */}
          <div
            className="inline-thread max-h-[60vh] overflow-y-auto p-3 sm:p-4"
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

            {!isLoading && !error && messages.length > 0 && (
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
                  className={"inline-msg-text"}
                >
                  {m.content}
                </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
