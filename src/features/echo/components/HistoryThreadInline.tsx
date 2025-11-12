import React, { useEffect, useRef } from 'react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import EchoAvatar from '@/components/ai-chat/EchoAvatar';
import AvatarSquircle from '@/components/ui/AvatarSquircle';

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

  if (isLoading) return <div className="text-[var(--eh-preview)] text-sm p-3">Loading…</div>;
  if (error) return <div className="text-[var(--eh-preview)] text-sm p-3">Couldn't load messages.</div>;
  if (!messages.length) return <div className="text-[var(--eh-preview)] text-sm p-3">No messages in this conversation yet.</div>;

  return (
    <div ref={ref} role="log" aria-live="polite">
      <ul className="list-none p-0 m-0">
        {messages.map((m) => (
          <li 
            key={m.id} 
            className={m.role === 'user' ? 'eh-msg eh-msg--right' : 'eh-msg'}
          >
            <div className="eh-msg__avatar" aria-label={m.role === 'user' ? 'You' : 'Echo'}>
              {m.role === 'user' ? (
                <AvatarSquircle size={36} className="bg-gradient-to-br from-purple-500 to-blue-500">
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                    U
                  </div>
                </AvatarSquircle>
              ) : (
                <EchoAvatar state="idle" size={36} />
              )}
            </div>
            <div className="eh-msg__body flex-1 min-w-0">
              <div className="eh-msg__label">{m.role === 'user' ? 'YOU' : 'ECHO'}</div>
              <div className="eh-msg__text">{m.content}</div>
            </div>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};
