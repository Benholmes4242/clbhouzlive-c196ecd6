import { useState, useCallback } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConversationSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onNewConversation: () => void;
  className?: string;
}

export function ConversationSearchBar({
  value,
  onChange,
  onNewConversation,
  className
}: ConversationSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Search Input */}
      <div className={cn(
        "relative flex-1 transition-all",
        isFocused && "ring-2 ring-primary/20 rounded-xl"
      )}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search conversations..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-9 pr-8 h-10 bg-muted/50 border-0 rounded-xl",
            "placeholder:text-muted-foreground/70",
            "focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-muted"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* New Conversation FAB */}
      <Button
        onClick={onNewConversation}
        size="icon"
        className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-md flex-shrink-0"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}
