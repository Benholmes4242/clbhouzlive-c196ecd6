import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  typingUsers: Array<{ user_id: string; name: string }>;
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className={cn("flex gap-2 justify-start mb-1", className)}>
      {/* Spacer for avatar alignment */}
      <div className="w-8 flex-shrink-0" />
      
      {/* Typing bubble */}
      <div className="px-4 py-3 rounded-[16px] rounded-bl-[4px] bg-background/45 border border-border/20">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[13px] italic ml-1 text-muted-foreground">
            {getTypingText()}
          </span>
        </div>
      </div>
    </div>
  );
}