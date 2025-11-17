import React, { useEffect, useRef } from 'react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import { EchoMessageRow } from '@/features/echo/components/EchoMessageRow';
import type { EchoMessage as EchoRowMessage } from '@/features/echo/state/echoTypes';

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


  useEffect(() => {
    if (!ref.current || !onHeightChange) return;
    const h = ref.current.getBoundingClientRect().height;
    onHeightChange(h);
  }, [messages?.length, onHeightChange]);

  if (isLoading) return <div className="text-[var(--eh-preview)] text-sm p-3">Loading…</div>;
  if (error) return <div className="text-[var(--eh-preview)] text-sm p-3">Couldn't load messages.</div>;
  if (!messages.length) return <div className="text-[var(--eh-preview)] text-sm p-3">No messages in this conversation yet.</div>;

  return (
    <div ref={ref} role="log" aria-live="polite">
      <div className="space-y-3">
        {messages.map((m, idx) => {
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
