import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import SearchSuggestions from './SearchSuggestions';

interface SearchActivatorProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (query: string) => void;
  initialQuery?: string;
}

const SearchActivator: React.FC<SearchActivatorProps> = ({
  isOpen,
  onOpen,
  onClose,
  onSubmit,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setShowSuggestions(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    setShowSuggestions(false);
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onSubmit(query);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (query) {
        setQuery('');
      } else {
        handleClose();
      }
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSubmit(suggestion);
    setShowSuggestions(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        className="ml-auto w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-200/80 flex items-center justify-center transition-colors shadow-sm"
        aria-label="Search videos"
      >
        <Search className="w-5 h-5 text-gray-700" />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-x-3 z-50">
      <motion.div
        initial={{ width: 40, borderRadius: 9999 }}
        animate={{ width: 'calc(100% - 24px)', borderRadius: 9999 }}
        transition={{ 
          duration: 0.2, 
          ease: [0.2, 0.8, 0.2, 1] 
        }}
        className="relative"
      >
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search videos…"
            className="w-full h-10 pl-10 pr-10 rounded-full bg-neutral-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            enterKeyHint="search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <AnimatePresence>
          {showSuggestions && (
            <SearchSuggestions
              query={debouncedQuery}
              onSelect={handleSuggestionClick}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SearchActivator;
