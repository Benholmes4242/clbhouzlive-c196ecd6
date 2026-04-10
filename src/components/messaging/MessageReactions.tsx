import { cn } from '@/lib/utils';
import type { Reaction } from '@/hooks/useMessageReactions';

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

  return (
    <div 
      className={cn(
        "flex flex-wrap gap-1 mt-1",
        isOwnMessage ? "justify-end" : "justify-start",
        className
      )}
    >
      {Object.entries(groupedReactions).map(([emoji, { count, hasUserReacted }]) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className={cn(
            "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors",
            hasUserReacted 
              ? "border" 
              : "bg-muted hover:bg-muted/80 border border-transparent"
          )}
          style={hasUserReacted ? { background: 'rgba(247,147,30,0.20)', borderColor: 'rgba(247,147,30,0.30)' } : undefined}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-muted-foreground">{count}</span>}
        </button>
      ))}
    </div>
  );
}
