import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, User, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoSearchBarProps {
  onSearch?: (query: string) => void;
  className?: string;
}

interface SearchSuggestion {
  type: 'recent' | 'popular' | 'category' | 'creator';
  text: string;
  icon: React.ReactNode;
}

// Mock suggestions - in production these would come from API
const POPULAR_SEARCHES: SearchSuggestion[] = [
  { type: 'popular', text: 'Course Vlogs', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { type: 'popular', text: 'Tips & Coaching', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { type: 'category', text: 'Challenge', icon: <Video className="h-3.5 w-3.5" /> },
];

/**
 * VideoSearchBar - Search with live suggestions for Videos tab
 * Searches: video title, creator name, course name
 * No orange ring - neutral grey border only
 */
export const VideoSearchBar: React.FC<VideoSearchBarProps> = ({
  onSearch,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('video-recent-searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 3));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('video-recent-searches', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onSearch?.(query.trim());
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    saveRecentSearch(text);
    onSearch?.(text);
    setIsFocused(false);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build suggestions list
  const getSuggestions = (): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    
    // Add recent searches first (max 3)
    recentSearches.slice(0, 3).forEach(text => {
      if (!query || text.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          type: 'recent',
          text,
          icon: <Clock className="h-3.5 w-3.5" />,
        });
      }
    });

    // Add popular/category suggestions
    POPULAR_SEARCHES.forEach(s => {
      if (!query || s.text.toLowerCase().includes(query.toLowerCase())) {
        if (!suggestions.some(existing => existing.text === s.text)) {
          suggestions.push(s);
        }
      }
    });

    return suggestions.slice(0, 6);
  };

  const suggestions = getSuggestions();
  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div ref={containerRef} className={cn("px-5 relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative h-10">
          {/* Background layer with blur - separate from content */}
          <div 
            className={cn(
              "absolute inset-0 rounded-full border transition-all duration-200",
              "bg-background/60 border-border/60",
              isFocused && "bg-background/80 border-border"
            )}
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          />
          {/* Content layer - icon sits here unblurred */}
          <div className="relative h-full flex items-center">
            {/* Search icon - flex centered, no transforms, integer pixel sizing */}
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Search videos, creators, courses..."
              className="w-full h-full pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground rounded-full bg-transparent"
              style={{
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 inset-y-0 flex items-center p-1 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-5 right-5 top-full mt-2 z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="py-1.5">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${idx}`}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-muted-foreground">{suggestion.icon}</span>
                  <span className="text-sm text-foreground">{suggestion.text}</span>
                  {suggestion.type === 'recent' && (
                    <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wide">Recent</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoSearchBar;
