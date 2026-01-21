import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
  triggerClassName?: string;
}

// Common emojis with golf-themed ones included
const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '🔥',
  '⛳', '🏌️', '🏌️‍♀️', '🏆', '🎯', '⭐',
  '👏', '🙌', '💪', '🤝', '👀', '💯',
];

export function EmojiPicker({ onSelect, className, triggerClassName }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", triggerClassName)}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-auto p-2", className)}
        side="top"
        align="end"
      >
        <div className="grid grid-cols-6 gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="p-2 text-xl hover:bg-muted rounded-md transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
