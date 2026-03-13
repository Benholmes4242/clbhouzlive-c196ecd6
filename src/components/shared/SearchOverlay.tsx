import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, Clock, TrendingUp } from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder: string;
  onSearch: (query: string) => void;
  onCommit?: (term: string) => void;
  recentSearches: string[];
  onClearRecent: () => void;
  onRemoveRecent: (term: string) => void;
  trendingItems: string[];
  children?: React.ReactNode;
  userId?: string;
}

function SearchOverlayInner({
  isOpen,
  onClose,
  placeholder,
  onSearch,
  onCommit,
  recentSearches,
  onClearRecent,
  onRemoveRecent,
  trendingItems,
  children,
}: SearchOverlayProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-focus with 100ms delay
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    } else {
      setInputValue('');
      onSearch('');
    }
  }, [isOpen, onSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);
  }, [onSearch]);

  const commitSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch(trimmed);
    onCommit?.(trimmed);
  }, [onSearch, onCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      commitSearch(inputValue);
    }
  }, [inputValue, commitSearch]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  const hasQuery = inputValue.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] bg-background flex flex-col"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 pb-3"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl bg-muted">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] -mr-3"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {!hasQuery ? (
              <div>
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={onClearRecent}
                        className="text-[11px] text-primary font-semibold"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-col">
                      {recentSearches.map(term => (
                        <div key={term} className="min-h-[44px] flex items-center px-4 gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <button
                            type="button"
                            onClick={() => commitSearch(term)}
                            className="flex-1 text-left text-sm text-foreground"
                          >
                            {term}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveRecent(term)}
                            className="p-1 text-muted-foreground"
                            aria-label={`Remove ${term}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                {trendingItems.length > 0 && (
                  <div>
                    <div className="px-4 pt-4 pb-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Trending
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {trendingItems.map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => commitSearch(item)}
                          className="min-h-[44px] flex items-center px-4 gap-3 text-sm text-foreground"
                        >
                          <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              children
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SearchOverlay = memo(SearchOverlayInner);
export default SearchOverlay;