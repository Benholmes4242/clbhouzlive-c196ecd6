import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Search, X, Clock, TrendingUp } from 'lucide-react';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRecentSearches } from './hooks/useExploreRecentSearches';
import { ExploreTile } from './ExploreTile';
import ExploreGridSkeleton from './ExploreGridSkeleton';

const TRENDING = [
  'Augusta National',
  'Links Golf',
  'Course Reviews',
  'Best Par 3s',
  'Bucket List Courses',
  'Hidden Gems',
];

interface ExploreSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

function ExploreSearchOverlayInner({ isOpen, onClose, userId }: ExploreSearchOverlayProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { searches, addSearch, removeSearch, clearAll } = useExploreRecentSearches();

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Auto-focus
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useExploreFeed({
    userId,
    searchQuery: debouncedQuery || undefined,
  });

  const handleCommit = useCallback((term: string) => {
    const trimmed = term.trim();
    if (trimmed) {
      addSearch(trimmed);
      setInputValue(trimmed);
    }
  }, [addSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommit(inputValue);
    inputRef.current?.blur();
  };

  const hasQuery = debouncedQuery.length > 0;

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
            className="flex items-center gap-2 px-3 pb-2"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 -ml-1 text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <form onSubmit={handleSubmit} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search courses & videos..."
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasQuery ? (
              <div className="px-4 py-3">
                {/* Recent searches */}
                {searches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">Recent</span>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs text-muted-foreground"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {searches.map((term) => (
                        <div key={term} className="flex items-center gap-3 py-2">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <button
                            type="button"
                            className="flex-1 text-left text-sm text-foreground"
                            onClick={() => {
                              setInputValue(term);
                              handleCommit(term);
                            }}
                          >
                            {term}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSearch(term)}
                            className="p-1 text-muted-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div>
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setInputValue(term);
                          handleCommit(term);
                        }}
                        className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {isLoading ? (
                  <ExploreGridSkeleton />
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <span className="text-3xl">📡</span>
                    <p className="text-muted-foreground text-sm">Something went wrong</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <span className="text-3xl">🔍</span>
                    <p className="text-foreground text-sm font-medium">No results found</p>
                    <p className="text-muted-foreground text-xs text-center max-w-[240px]">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-[2px] px-[2px]">
                    {posts.map((post, index) => (
                      <ExploreTile key={post.id} post={post} index={index} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const ExploreSearchOverlay = memo(ExploreSearchOverlayInner);
