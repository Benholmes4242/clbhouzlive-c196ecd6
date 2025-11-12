import React, { useEffect, useRef } from 'react';
import { useEchoThreadMessages } from '../hooks/useEchoThreadMessages';
import EchoAvatar from '@/components/ai-chat/EchoAvatar';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { useProfileData } from '@/hooks/useProfileData';

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
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <li 
              key={m.id} 
              className={isUser ? 'eh-line eh-line--user' : 'eh-line eh-line--echo'}
              aria-label={isUser ? 'You' : 'Echo'}
            >
              {/* Left side: Echo avatar or spacer */}
              {!isUser ? (
                <div className="eh-line__avatar">
                  <EchoAvatar state="idle" size={28} />
                </div>
              ) : (
                <div className="eh-line__pad" />
              )}

              {/* Content */}
              <div className="eh-bubble">
                <div className="eh-msg__label">{isUser ? 'YOU' : 'ECHO'}</div>
                <div className="eh-text">{m.content}</div>
              </div>

              {/* Right side: User avatar or spacer */}
              {isUser ? (
                <div className="eh-line__avatar">
                  <AvatarSquircle 
                    size={28} 
                    src={profile?.profile_photo_url}
                    alt="Your profile"
                    className="bg-gradient-to-br from-purple-500 to-blue-500"
                  >
                    {!profile?.profile_photo_url && (
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                        {profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </AvatarSquircle>
                </div>
              ) : (
                <div className="eh-line__pad" />
              )}
            </li>
          );
        })}
      </ul>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};
