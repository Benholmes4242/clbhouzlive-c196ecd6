import React, { useMemo } from 'react';
import clsx from 'clsx';
import './message-turn.css';

export type MessageTurnProps = {
  role: 'you' | 'echo';
  avatarUrl?: string;           // user's squircle or echo mark
  avatarFallback?: React.ReactNode; // optional fallback (icon)
  nameLabel: string;            // "YOU" / "ECHO"
  timestamp?: string;           // already formatted (e.g., "Today · 06:58")
  text?: string;                // plain/markdown reduced to text; keep \n\n for paragraphs
  children?: React.ReactNode;   // if you already render rich content upstream
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
    // Split on blank lines, preserve bullet lines as their own <p>
    return text.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
  }, [text]);

  const isYou = role === 'you';

  return (
    <div className={clsx('msgturn', isYou ? 'msgturn--you' : 'msgturn--echo', className)}>
      {/* LEFT rail (Echo) or spacer */}
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

      {/* RIGHT rail (You) or spacer */}
      {isYou && (
        <div className="msgturn__avatar msgturn__avatar--right">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : avatarFallback}
        </div>
      )}
    </div>
  );
};

export default MessageTurn;
