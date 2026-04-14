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
    <div
      className={cn("relative", className)}
      style={{
        height: 38, borderRadius: 12,
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.08)',
        display: 'flex', alignItems: 'center',
        padding: '0 12px 0 36px',
      }}
    >
      {/* Search icon */}
      <Search
        className="absolute"
        style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
        size={14}
      />

      <input
        type="text"
        placeholder="Search conversations…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 bg-transparent outline-none"
        style={{
          fontSize: '13.5px', color: '#1e293b',
          border: 'none',
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute flex items-center justify-center"
          style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
        >
          <X style={{ color: '#94a3b8' }} size={13} />
        </button>
      )}
    </div>
  );
}
