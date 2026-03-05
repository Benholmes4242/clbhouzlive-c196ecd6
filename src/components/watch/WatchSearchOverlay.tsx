import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentSearches } from './hooks/useRecentSearches';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchTile from './WatchTile';
import WatchGridSkeleton from './WatchGridSkeleton';

const TRENDING = [
  'Augusta National', 'The Open Championship', 'driver tips',
  'course vlogs', 'links golf', 'bunker shots',
  'St Andrews', 'Pebble Beach',
];

interface WatchSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

const WatchSearchOverlay: React.FC<WatchSearchOverlayProps> = ({ isOpen, onClose, userId }) => {
  const [inputValue, setInputValue] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { searches, addSearch, removeSearch } = useRecentSearches();

  const { posts, isLoading } = useWatchFeed({
    userId,
    filter: 'trending',
    searchQuery: activeQuery || undefined,
  });

  // Auto-focus
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInputValue('');
      setActiveQuery('');
    }
  }, [isOpen]);

  // Debounced search
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim();
      setActiveQuery(trimmed);
      if (trimmed) addSearch(trimmed);
    }, 300);
  }, [addSearch]);

  const fireSearch = useCallback((term: string) => {
    setInputValue(term);
    setActiveQuery(term);
    addSearch(term);
  }, [addSearch]);

  const hasQuery = activeQuery.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex flex-col bg-[var(--bg-page)] overflow-y-auto"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-2">
            <button onClick={onClose} className="shrink-0 p-1">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search shorts..."
                className="w-full h-10 rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              />
              {inputValue && (
                <button
                  onClick={() => { setInputValue(''); setActiveQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {!hasQuery ? (
            <div className="px-4 py-2 space-y-6">
              {/* Recent searches */}
              {searches.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[1px] mb-2">
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {searches.map((s) => (
                      <div key={s} className="flex items-center justify-between py-1.5">
                        <button
                          onClick={() => fireSearch(s)}
                          className="text-sm text-foreground"
                        >
                          {s}
                        </button>
                        <button onClick={() => removeSearch(s)} className="p-1">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[1px] mb-2">
                  Trending Searches
                </h3>
                <div className="space-y-1">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      onClick={() => fireSearch(t)}
                      className="flex items-center gap-2 py-1.5 text-sm text-foreground"
                    >
                      <span>🔥</span>
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-[2px] pt-2">
              {isLoading ? (
                <WatchGridSkeleton />
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <span className="text-[48px]">🔍</span>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    No results for "{activeQuery}"
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Try different search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-[2px]">
                  {posts.map((post, i) => (
                    <WatchTile key={post.id} post={post} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WatchSearchOverlay;
