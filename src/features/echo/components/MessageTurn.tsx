import React, { useMemo } from 'react';
import clsx from 'clsx';
import './message-turn.css';

export type MessageTurnProps = {
  role: 'you' | 'echo';
  avatarUrl?: string;
  avatarFallback?: React.ReactNode;
  nameLabel: string;
  timestamp?: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
};

export const MessageTurn: React.FC<MessageTurnProps> = ({
  role,
  avatarUrl,
  avatarFallback,
  nameLabel,
  timestamp,
  text,
  children,
  className
}) => {
  const paragraphs = useMemo(() => {
    if (!text) return [];
    return text.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
  }, [text]);

  const isYou = role === 'you';

  return (
    <div className={clsx('msgturn', isYou ? 'msgturn--you' : 'msgturn--echo', className)}>
      {!isYou && (
        <div className="msgturn__avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : avatarFallback}
        </div>
      )}

      <div className="msgturn__body">
        <div className="msgturn__meta">
          <span className="msgturn__name">{nameLabel}</span>
          {timestamp && <span className="msgturn__time">{timestamp}</span>}
        </div>

        <div className="msgturn__prose">
          {children ? children : paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>

      {isYou && (
        <div className="msgturn__avatar msgturn__avatar--right">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : avatarFallback}
        </div>
      )}
    </div>
  );
};

export default MessageTurn;
