import React, { useEffect, useRef } from 'react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import { Squircle } from '@/components/ui/squircle';
import { PiWaveform } from 'react-icons/pi';
import SquircleImage from '@/components/ui/SquircleImage';
import { useProfileData } from '@/hooks/useProfileData';
import { MarkdownMessage } from '@/components/ai-chat/MarkdownMessage';
import { formatAbsoluteDateTime } from '@/utils/date';
import ThreadDivider from './ThreadDivider';

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

  return (
    <div ref={ref} role="log" aria-live="polite">
      <ul className="list-none p-0 m-0">
        {messages.map((m, index) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id}>
              <li 
                className={isUser ? 'eh-line eh-line--user' : 'eh-line eh-line--echo'}
                aria-label={isUser ? 'You' : 'Echo'}
              >
                {/* Left side: Echo avatar or spacer */}
                {!isUser ? (
                  <div className="eh-line__avatar">
                    <Squircle width={42} height={42}>
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.45)',
                          border: '1px solid rgba(255,255,255,0.55)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                            opacity: 0.8,
                            pointerEvents: 'none'
                          }}
                        />
                        <PiWaveform size={29} className="text-black/80" style={{ position: 'relative', zIndex: 1 }} />
                      </div>
                    </Squircle>
                  </div>
                ) : (
                  <div className="eh-line__pad" />
                )}

                {/* Content */}
                <div className="eh-bubble">
                  <div className="eh-msg__label">{isUser ? 'YOU' : 'ECHO'}</div>
                  <div className="eh-text">
                    <MarkdownMessage content={m.content} />
                  </div>
                </div>

                {/* Right side: User avatar or spacer */}
                {isUser ? (
                  <div className="eh-line__avatar">
                    {profile?.profile_photo_url ? (
                      <SquircleImage
                        size={42}
                        src={profile.profile_photo_url}
                        alt={profile?.display_name || profile?.username || 'User'}
                        ringColor="rgba(255,255,255,0.2)"
                        ringWidth={1}
                      />
                    ) : (
                      <div 
                        className="flex items-center justify-center text-[11px] font-medium text-white/90"
                        style={{
                          width: 42,
                          height: 42,
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                        }}
                      >
                        {profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="eh-line__pad" />
                )}
              </li>
              
              {/* Add divider between messages, but not after the last one */}
              {index < messages.length - 1 && <ThreadDivider />}
            </div>
          );
        })}
      </ul>
      
      {/* Footer meta */}
      <div className="mt-4 mx-auto h-px" style={{ width: '70%', background: 'rgba(255,255,255,0.12)' }} />
      <div className="pt-2 pb-1 flex items-center text-[12.5px]" style={{ color: 'var(--eh-meta)', opacity: 0.85 }}>
        {createdAt && <time aria-label="Conversation time">{formatAbsoluteDateTime(createdAt)}</time>}
      </div>
      
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
};
