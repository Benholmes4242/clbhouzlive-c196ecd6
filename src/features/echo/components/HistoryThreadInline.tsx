import React, { useEffect, useRef } from 'react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import EchoAvatar from '@/components/ai-chat/EchoAvatar';
import SquircleImage from '@/components/ui/SquircleImage';
import { useProfileData } from '@/hooks/useProfileData';
import { formatAbsoluteDateTime } from '@/utils/date';
import { formatMessageTime } from '@/utils/dateFormat';
import MessageTurn from './MessageTurn';
import ThreadDivider from './ThreadDivider';
import './message-turn.css';
import './thread-divider.css';

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
  const { profile } = useProfileData();

  useEffect(() => {
    if (!ref.current || !onHeightChange) return;
    const h = ref.current.getBoundingClientRect().height;
    onHeightChange(h);
  }, [messages?.length, onHeightChange]);

  if (isLoading) return <div className="text-[var(--eh-preview)] text-sm p-3">Loading…</div>;
  if (error) return <div className="text-[var(--eh-preview)] text-sm p-3">Couldn't load messages.</div>;
  if (!messages.length) return <div className="text-[var(--eh-preview)] text-sm p-3">No messages in this conversation yet.</div>;

  const rows: React.ReactNode[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const isYou = m.role === 'user';

    rows.push(
      <MessageTurn
        key={m.id}
        role={isYou ? 'you' : 'echo'}
        avatarUrl={isYou ? profile?.profile_photo_url : undefined}
        avatarFallback={
          isYou ? (
            profile?.profile_photo_url ? undefined : (
              <div 
                className="flex items-center justify-center text-[11px] font-medium text-white/90"
                style={{
                  width: 28,
                  height: 28,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
              >
                {profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )
          ) : (
            <EchoAvatar state="idle" size={28} />
          )
        }
        nameLabel={isYou ? 'YOU' : 'ECHO'}
        timestamp={formatMessageTime(m.created_at)}
        text={m.content}
      />
    );

    // Divider BETWEEN turns only; not after the last
    if (i < messages.length - 1) {
      rows.push(<ThreadDivider key={`div-${messages[i + 1].id}`} />);
    }
  }

  return (
    <div ref={ref} role="log" aria-live="polite">
      <div className="eh-thread">
        {rows}
      </div>
      
      {/* Footer meta */}
      <div className="mt-4 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="pt-2 pb-1 flex items-center text-[12.5px]" style={{ color: 'var(--eh-meta)', opacity: 0.85 }}>
        {createdAt && <time aria-label="Conversation time">{formatAbsoluteDateTime(createdAt)}</time>}
      </div>
      
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
};
