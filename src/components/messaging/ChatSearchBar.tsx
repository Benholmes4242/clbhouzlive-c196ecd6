/**
 * ChatSearchBar - Search messages within a conversation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MessageWithSender } from '@/types/messaging';

interface ChatSearchBarProps {
  messages: MessageWithSender[];
  onClose: () => void;
  onNavigateToMessage: (messageId: string) => void;
}

export function ChatSearchBar({
  messages,
  onClose,
  onNavigateToMessage,
}: ChatSearchBarProps) {
  const [query, setQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const searchTerm = query.toLowerCase();
    return messages.filter(msg =>
      msg.content?.toLowerCase().includes(searchTerm)
    );
  }, [messages, query]);

  useEffect(() => {
    if (matches.length > 0 && matches[currentMatchIndex]) {
      onNavigateToMessage(matches[currentMatchIndex].id);
    }
  }, [currentMatchIndex, matches, onNavigateToMessage]);

  const handlePrevious = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex(prev =>
      prev === 0 ? matches.length - 1 : prev - 1
    );
  }, [matches.length]);

  const handleNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex(prev =>
      prev === matches.length - 1 ? 0 : prev + 1
    );
  }, [matches.length]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [query]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 border-b border-amber-200/20">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in conversation..."
          className="pl-10 pr-4 h-9 rounded-full bg-amber-50/50 border border-amber-200/30 text-sm focus:border-amber-300 focus:ring-1 focus:ring-amber-200"
          autoFocus
        />
      </div>

      {/* Match count and navigation */}
      {query.trim() && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#8E8E93] min-w-[60px] text-center">
            {matches.length === 0
              ? 'No results'
              : `${currentMatchIndex + 1} of ${matches.length}`
            }
          </span>

          <button
            onClick={handlePrevious}
            disabled={matches.length === 0}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full",
              matches.length > 0
                ? "hover:bg-amber-50/50 active:bg-amber-100/30"
                : "opacity-30"
            )}
          >
            <ChevronUp className="w-4 h-4 text-[#1D1D1F]" />
          </button>

          <button
            onClick={handleNext}
            disabled={matches.length === 0}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full",
              matches.length > 0
                ? "hover:bg-amber-50/50 active:bg-amber-100/30"
                : "opacity-30"
            )}
          >
            <ChevronDown className="w-4 h-4 text-[#1D1D1F]" />
          </button>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-50/50 active:bg-amber-100/30"
      >
        <X className="w-4 h-4 text-[#8E8E93]" />
      </button>
    </div>
  );
}
