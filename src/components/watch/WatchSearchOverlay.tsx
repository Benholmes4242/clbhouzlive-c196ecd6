import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, X, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentSearches } from './hooks/useRecentSearches';
import { WatchGrid } from './WatchGrid';
import { useWatchShorts } from './hooks/useWatchShorts';
import type { FeedPost } from '@/components/media-system/types/media';

const TRENDING_SEARCHES = [
  'Augusta National',
  'The Open Championship',
  'bunker shots',
  'hole in one',
  'Pebble Beach',
];

interface WatchSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  onTileTap: (post: FeedPost, index: number) => void;
}

export function WatchSearchOverlay({ isOpen, onClose, userId, onTileTap }: WatchSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { searches, addSearch, removeSearch } = useRecentSearches();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  const { posts, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useWatchShorts({
    userId,
    filter: 'trending',
    searchQuery: debouncedQuery || undefined,
  });

  const handleSearch = useCallback((term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    addSearch(term);
  }, [addSearch]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addSearch(query.trim());
    }
  }, [query, addSearch]);

  const isSearching = debouncedQuery.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: '#0A0A0A',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          }}
        >
          {/* Search header */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
            <button type="button" onClick={onClose} className="shrink-0 p-1">
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div
              className="flex-1 h-10 rounded-xl flex items-center gap-2.5 px-3.5"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Search className="w-4 h-4 text-white/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shorts..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setDebouncedQuery(''); }}>
                  <X className="w-4 h-4 text-white/40" />
                </button>
              )}
            </div>
          </form>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-safe">
            {isSearching ? (
              /* Search results */
              <WatchGrid
                posts={posts}
                isLoading={isLoading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                onTileTap={onTileTap}
                emptyState={
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <span className="text-2xl mb-3">🔍</span>
                    <p className="text-white/60 text-sm font-medium">No results for "{debouncedQuery}"</p>
                    <p className="text-white/30 text-xs mt-1">Try different search terms</p>
                  </div>
                }
              />
            ) : (
              /* Pre-search state */
              <div className="px-4 space-y-6">
                {/* Recent Searches */}
                {searches.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Recent Searches</p>
                    <div className="space-y-0.5">
                      {searches.map((s) => (
                        <div key={s} className="flex items-center justify-between py-2">
                          <button
                            onClick={() => handleSearch(s)}
                            className="text-white/80 text-sm text-left flex-1 truncate"
                          >
                            {s}
                          </button>
                          <button onClick={() => removeSearch(s)} className="p-1 shrink-0">
                            <X className="w-3.5 h-3.5 text-white/30" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Trending Searches</p>
                  <div className="space-y-0.5">
                    {TRENDING_SEARCHES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSearch(s)}
                        className="flex items-center gap-2 py-2 w-full text-left"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-white/80 text-sm">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
