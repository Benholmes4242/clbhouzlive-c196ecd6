import React, { useEffect, useRef, useMemo } from 'react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import { EchoMessageRow } from '@/features/echo/components/EchoMessageRow';
import type { EchoMessage as EchoRowMessage } from '@/features/echo/state/echoTypes';

const MAX_VISIBLE_MESSAGES = 100;

export interface HistoryThreadInlineProps {
  threadId: string;
  title: string;
  createdAt?: string;
  messageCount?: number;
  onCollapse: () => void;
  onCopyLink?: () => void;
  onOpenFull?: () => void;
  onDelete?: () => void;
  onHeightChange?: (height: number) => void;
  footer?: React.ReactNode;
}

export const HistoryThreadInline: React.FC<HistoryThreadInlineProps> = ({
  threadId,
  createdAt,
  messageCount,
  onHeightChange,
  footer,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading, error } = useEchoThreadMessages(threadId);

  // Cap messages to prevent excessive DOM rendering
  const visibleMessages = useMemo(() => {
    if (!messages || messages.length <= MAX_VISIBLE_MESSAGES) return messages;
    return messages.slice(-MAX_VISIBLE_MESSAGES);
  }, [messages]);

  const hiddenCount = (messages?.length ?? 0) > MAX_VISIBLE_MESSAGES
    ? messages.length - MAX_VISIBLE_MESSAGES
    : 0;

  useEffect(() => {
    if (!ref.current || !onHeightChange) return;
    const h = ref.current.getBoundingClientRect().height;
    onHeightChange(h);
  }, [visibleMessages?.length, onHeightChange]);

  if (isLoading) return <div className="text-[var(--eh-preview)] text-body-md p-3">Loading…</div>;
  if (error) return <div className="text-[var(--eh-preview)] text-body-md p-3">Couldn't load messages.</div>;
  if (!messages.length) return <div className="text-[var(--eh-preview)] text-body-md p-3">No messages in this conversation yet.</div>;

  return (
    <div ref={ref} role="log" aria-live="polite">
      <div className="space-y-3">
        {hiddenCount > 0 && (
          <div className="text-center text-xs text-[var(--eh-preview)] mb-2">
            Showing latest {MAX_VISIBLE_MESSAGES} messages ({hiddenCount} older messages hidden)
          </div>
        )}
        
        {visibleMessages.map((m, idx) => {
          const row: EchoRowMessage = {
            id: m.id ?? String(idx),
            role: (m.role === 'user' ? 'user' : 'assistant'),
            content: m.content ?? '',
            createdAt: m.created_at ?? new Date(0).toISOString(),
          };
          return <EchoMessageRow key={row.id} message={row} />;
        })}
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
};
