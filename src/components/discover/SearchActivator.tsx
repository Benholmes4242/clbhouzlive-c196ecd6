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
        className="ml-auto w-10 h-10 rounded-full flex items-center justify-center transition-all duration-120"
        style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(12px)',
        }}
        aria-label="Search videos"
      >
        <Search className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.85)' }} />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-x-3 z-[150]">
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
            <Search className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.85)' }} />
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search videos…"
            className="w-full h-10 pl-10 pr-10 rounded-full text-sm outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(255,255,255,0.05)',
              transition: 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.16)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            }}
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            enterKeyHint="search"
          />
          <style>{`
            input[type="search"]::placeholder {
              color: rgba(255,255,255,0.75);
              font-weight: 400;
            }
          `}</style>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,1)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
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
              onClose={() => setShowSuggestions(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SearchActivator;
