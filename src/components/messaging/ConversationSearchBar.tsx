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
      {/* Search Input - warm glass pill */}
      <div className="relative flex-1">
        <div className={cn(
          "flex items-center gap-3 h-[40px] rounded-xl px-4 transition-all bg-white/70 border border-amber-200/30",
          isFocused && "ring-1 ring-amber-200 border-amber-300"
        )}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#A8A29E' }} />
          <input
            type="text"
            placeholder="Search conversations…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 bg-transparent outline-none text-[13px] font-normal placeholder:font-normal"
            style={{ color: '#1C1917' }}
          />
          {value && (
            <button
              onClick={handleClear}
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#A8A29E' }}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
