import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onNewConversation: () => void;
  hideNewButton?: boolean;
  className?: string;
}

export function ConversationSearchBar({
  value,
  onChange,
  onNewConversation,
  hideNewButton = false,
  className
}: ConversationSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Search Input - WhatsApp style rounded pill */}
      <div className="relative flex-1">
        <div className={cn(
          "flex items-center gap-3 h-[40px] bg-white rounded-full px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all",
          isFocused && "ring-2 ring-[#007AFF]/20"
        )}>
          <Search className="w-5 h-5 text-[#8E8E93] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93]"
          />
          {value && (
            <button
              onClick={handleClear}
              className="w-5 h-5 rounded-full bg-[#8E8E93] flex items-center justify-center flex-shrink-0"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
