import React, { useEffect, useRef } from 'react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';

export interface HistoryThreadInlineProps {
  threadId: string;
  title: string;
  onCollapse: () => void;
  onCopyLink?: () => void;
  onOpenFull?: () => void;
  onDelete?: () => void;
  onHeightChange?: (height: number) => void;
  footer?: React.ReactNode;
}

export const HistoryThreadInline: React.FC<HistoryThreadInlineProps> = ({
  threadId,
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

  if (isLoading) return <div className="eh-msg eh-sub">Loading…</div>;
  if (error) return <div className="eh-msg eh-sub">Couldn't load messages.</div>;
  if (!messages.length) return <div className="eh-msg eh-sub">No messages in this conversation yet.</div>;

  return (
    <div ref={ref}>
      {messages.map((m) => (
        <div key={m.id} className="eh-msg">
          <div className="eh-from">{m.role === 'user' ? 'You' : 'Echo'}</div>
          <div>{m.content}</div>
        </div>
      ))}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};
