/**
 * TypingIndicator - Shows who is typing with bouncing dots
 * Phase 3: Group-aware with sender name strip
 */

interface TypingIndicatorProps {
  typingUsers: Array<{ user_id: string; name: string }>;
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) return typingUsers[0].name;
    if (typingUsers.length === 2) return `${typingUsers[0].name} and ${typingUsers[1].name}`;
    return `${typingUsers[0].name} and ${typingUsers.length - 1} others`;
  };

  return (
    <div className={className} style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', alignItems: 'flex-end', marginBottom: 4 }}>
      {/* Spacer for avatar alignment */}
      <div style={{ width: 28, flexShrink: 0 }} />

      <div>
        {/* Sender name strip */}
        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b', paddingLeft: 4, marginBottom: 3 }}>
          {getTypingText()}
        </div>

        {/* Dots bubble */}
        <div
          style={{
            padding: '9px 16px',
            borderRadius: '16px 16px 16px 4px',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'inline-flex',
            gap: 4,
          }}
        >
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#cbd5e1',
                animation: 'typing-bounce 1.2s infinite',
                animationDelay: `${delay}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
