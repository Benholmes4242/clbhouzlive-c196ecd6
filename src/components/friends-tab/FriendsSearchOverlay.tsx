import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, TrendingUp } from 'lucide-react';
import { useFriendsRecentSearches } from './hooks/useFriendsRecentSearches';
import { useFriendsFeed } from './hooks/useFriendsFeed';
import { FriendsCard } from './FriendsCard';
import { FriendsFeedSkeleton } from './FriendsFeedSkeleton';

interface FriendsSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const TRENDING = [
  'Golf Swing',
  'Course Tour',
  'Bunker Shot',
  'Putting Tips',
  'Hole in One',
  'Golf Cart',
];

export function FriendsSearchOverlay({ isOpen, onClose, userId }: FriendsSearchOverlayProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { searches, addSearch, removeSearch, clearAll } = useFriendsRecentSearches();

  const { posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useFriendsFeed({
      userId,
      mode: 'latest',
      searchQuery: activeQuery || undefined,
    });

  // Auto-focus with delay
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
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
      setActiveQuery(value.trim());
    }, 300);
  }, []);

  const commitSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    setActiveQuery(trimmed);
    addSearch(trimmed);
  }, [addSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      commitSearch(inputValue);
    }
  }, [inputValue, commitSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasQuery = activeQuery.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] bg-background flex flex-col"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3">
            <button
              onClick={onClose}
              className="p-3 -ml-3 rounded-full hover:bg-muted transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={22} className="text-foreground" />
            </button>
            <div className="flex-1 flex items-center gap-3 bg-muted rounded-full px-4 py-3">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search friends' posts..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              {inputValue && (
                <button
                  onClick={() => { setInputValue(''); setActiveQuery(''); }}
                  className="p-0.5 rounded-full hover:bg-background/50 transition-colors"
                  aria-label="Clear"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasQuery ? (
              <div className="px-4 py-2">
                {/* Recent searches */}
                {searches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">Recent</span>
                      <button
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {searches.map(s => (
                        <div key={s} className="flex items-center justify-between group">
                          <button
                            onClick={() => commitSearch(s)}
                            className="flex-1 text-left text-sm text-foreground py-2 pr-2"
                          >
                            {s}
                          </button>
                          <button
                            onClick={() => removeSearch(s)}
                            className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                            aria-label={`Remove ${s}`}
                          >
                            <X size={14} className="text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div>
                  <span className="text-sm font-medium text-foreground mb-3 block">Trending</span>
                  <div className="flex flex-col gap-1">
                    {TRENDING.map(t => (
                      <button
                        key={t}
                        onClick={() => commitSearch(t)}
                        className="flex items-center gap-3 text-left text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
                      >
                        <TrendingUp size={16} className="shrink-0" />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {isLoading && posts.length === 0 ? (
                  <FriendsFeedSkeleton />
                ) : isError && posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-3 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full"
                    >
                      Try Again
                    </button>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No results for "<span className="text-foreground font-medium">{activeQuery}</span>"
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-3 pb-4">
                    {posts.map(post => (
                      <FriendsCard key={post.id} post={post} isAutoplayEligible={false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
