/**
 * HistoryThreadInline - Inline thread expansion accordion
 * Renders conversation replay as prose text (no bubbles)
 */

import React, { useEffect, useRef } from 'react';
import { ui } from '@/tokens/ui';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';

export interface HistoryThreadInlineProps {
  threadId: string;
  title: string;
  onCollapse: () => void;
  onCopyLink?: () => void;
  onOpenFull?: () => void;
  onDelete?: () => void;
  onHeightChange?: (height: number) => void;
  footer?: React.ReactNode; // tags row
}

export const HistoryThreadInline: React.FC<HistoryThreadInlineProps> = ({
  threadId,
  title,
  onCollapse,
  onCopyLink,
  onOpenFull,
  onHeightChange,
  footer,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading, error } = useEchoThreadMessages(threadId);

  useEffect(() => {
    if (!ref.current || !onHeightChange) return;
    const h = ref.current.getBoundingClientRect().height;
    onHeightChange(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages?.length]);

  return (
    <div className="mt-4">
      <div
        ref={ref}
        className="eh-panel-inner eh-in"
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="px-1">
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
            <div className="eh-prose mx-auto" style={{ color: ui.tone.text }}>
              {messages.map((m, i) => (
                <section key={m.id ?? i} className="mb-4 md:mb-5">
                  <div
                    className="mb-2 uppercase tracking-wide"
                    style={{ fontSize: 12, opacity: 0.55 }}
                  >
                    {m.role === 'user' ? 'You' : 'Echo'} ·{' '}
                    {m.created_at
                      ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </div>
                  <div
                    style={{
                      fontSize: ui.font.body,
                      lineHeight: 1.45,
                      filter: m.role === 'user' ? 'brightness(1.05)' : 'none',
                    }}
                  >
                    {m.content}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Optional footer: tags/editor row */}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
};
