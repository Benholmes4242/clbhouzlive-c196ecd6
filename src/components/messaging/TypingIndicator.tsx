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
      
      {/* Typing bubble - WhatsApp style */}
      <div className="px-4 py-3 bg-white rounded-[18px] rounded-bl-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-[13px] text-[#8E8E93] italic ml-1">
            {getTypingText()}
          </span>
        </div>
      </div>
    </div>
  );
}
