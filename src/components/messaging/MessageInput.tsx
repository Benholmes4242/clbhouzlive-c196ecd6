import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageWithSender } from '@/types/messaging';

interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => void;
  replyingTo?: MessageWithSender | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  replyingTo,
  onCancelReply,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Focus when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage, replyingTo?.id);
    setMessage('');
    onCancelReply();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const replyToName = replyingTo?.sender?.display_name || replyingTo?.sender?.username || 'Unknown';

  return (
    <div className="border-t border-border bg-background">
      {/* Reply preview bar */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">
              Replying to {replyToName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5',
              'text-sm placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-[120px]'
            )}
          />
        </div>

        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="rounded-full h-10 w-10 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
