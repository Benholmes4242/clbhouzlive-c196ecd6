import React, { useMemo } from 'react';
import clsx from 'clsx';
import './message-turn.css';

export type MessageTurnProps = {
  role: 'you' | 'echo';
  avatarUrl?: string;
  avatarFallback?: React.ReactNode;
  nameLabel: string;            // "YOU" | "ECHO"
  timestamp?: string;           // preformatted (e.g., "Today · 06:58")
  text?: string;                // plain text with \n\n for paragraphs
  children?: React.ReactNode;   // if you render rich content upstream
  className?: string;
};

export const MessageTurn: React.FC<MessageTurnProps> = ({
  role, avatarUrl, avatarFallback, nameLabel, timestamp, text, children, className
}) => {
  const isYou = role === 'you';
  const paragraphs = useMemo(() => {
    if (!text) return [];
    return text.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
  }, [text]);

  return (
    <div className={clsx('msgturn', isYou ? 'msgturn--you' : 'msgturn--echo', className)}>
      {/* Avatar rail (left for echo, right for you via row-reverse) */}
      <div className="msgturn__avatar">
        {avatarUrl ? <img src={avatarUrl} alt="" /> : avatarFallback}
      </div>

      <div className="msgturn__body">
        <div className="msgturn__meta">
          <span className="msgturn__name">{nameLabel}</span>
          {timestamp && <span className="msgturn__time">{timestamp}</span>}
        </div>

        <div className="msgturn__prose">
          {children ? children : paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </div>
  );
};

export default MessageTurn;
