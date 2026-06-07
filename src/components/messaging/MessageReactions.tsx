import { cn } from '@/lib/utils';
import type { Reaction } from '@/hooks/useMessageReactions';
import { AMBER, AMBER_TINT_10, AMBER_TINT_25, INK_MUTE, INK_TINT_05, HAIRLINE_INK_7 } from './_shared/tokens';

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId: string | undefined;
  onToggleReaction: (emoji: string) => void;
  isOwnMessage: boolean;
  className?: string;
}

export function MessageReactions({
  reactions,
  currentUserId,
  onToggleReaction,
  isOwnMessage,
  className,
}: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  // Group reactions by emoji and count
  const groupedReactions = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, hasUserReacted: false };
    }
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) {
      acc[r.emoji].hasUserReacted = true;
    }
    return acc;
  }, {} as Record<string, { count: number; hasUserReacted: boolean }>);

  const entries = Object.entries(groupedReactions);
  const visible = entries.slice(0, 3);
  const overflow = entries.length - visible.length;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 mt-0.5",
        isOwnMessage ? "justify-end pr-1" : "justify-start pl-1",
        className
      )}
    >
      {visible.map(([emoji, { count, hasUserReacted }]) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className="flex items-center gap-0.5 active:scale-[0.95] transition-transform"
          style={{
            padding: '3px 7px',
            borderRadius: 99,
            background: hasUserReacted ? AMBER_TINT_10 : INK_TINT_05,
            border: `0.5px solid ${hasUserReacted ? AMBER_TINT_25 : HAIRLINE_INK_7}`,
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: 14 }}>{emoji}</span>
          {count > 1 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: hasUserReacted ? AMBER : INK_MUTE, marginLeft: 2 }}>
              {count}
            </span>
          )}
        </button>
      ))}
      {overflow > 0 && (
        <div
          style={{
            padding: '3px 7px',
            borderRadius: 99,
            background: INK_TINT_05,
            border: `0.5px solid ${HAIRLINE_INK_7}`,
            fontSize: 11,
            fontWeight: 600,
            color: INK_MUTE,
            lineHeight: 1,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
