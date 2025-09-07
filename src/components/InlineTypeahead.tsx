import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin } from 'lucide-react';
import { useCourseSearch, getSuggestions } from '@/hooks/useCourseSearch';
import { getFlagCode } from '@/utils/countryFlags';

interface Course {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  region: string;
  thumbnail_image?: string;
  rating?: number;
  played?: boolean;
}

interface InlineTypeaheadProps {
  placeholder?: string;
  onPick: (course: Course) => void;
  onClose: () => void;
  userId?: string;
  isSearchMode?: boolean;
  onOpenSearch: () => void;
  existingCourseIds?: string[];
  onJumpToSlot?: (slotIndex: number) => void;
  onSwapWithSlot?: (slotIndex: number) => void;
}

export function InlineTypeahead({
  placeholder = "Search courses…",
  onPick,
  onClose,
  userId,
  isSearchMode = false,
  onOpenSearch,
  existingCourseIds = [],
  onJumpToSlot,
  onSwapWithSlot
}: InlineTypeaheadProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Course[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, loading, error } = useCourseSearch(query, {
    debounceMs: 250,
    limit: 20,
    userId
  });

  const items = query.trim().length > 0 ? searchResults : suggestions;

  // Load suggestions on mount
  useEffect(() => {
    if (userId && isSearchMode) {
      getSuggestions(userId).then(setSuggestions);
    }
  }, [userId, isSearchMode]);

  // Auto-focus input when search mode opens
  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchMode]);

  // Reset focused index when items change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [items]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          handlePickCourse(items[focusedIndex]);
        }
        break;
    }
  };

  const handlePickCourse = (course: Course) => {
    // Check if course already exists in top 10
    const existingIndex = existingCourseIds.indexOf(course.id);
    if (existingIndex !== -1) {
      // Show duplicate options - for now just notify
      console.log(`Course already in slot ${existingIndex + 1}`);
      // TODO: Show jump/swap UI
      return;
    }
    
    onPick(course);
  };

  const scrollToFocusedItem = (index: number) => {
    if (resultsRef.current) {
      const items = resultsRef.current.children;
      const item = items[index] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0) {
      scrollToFocusedItem(focusedIndex);
    }
  }, [focusedIndex]);

  if (!isSearchMode) {
    return (
      <Button
        variant="ghost"
        onClick={onOpenSearch}
        className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Search courses to add to Top 10"
      >
        <Search className="w-6 h-6 mb-2" />
        <span className="text-sm">Search courses</span>
      </Button>
    );
  }

  return (
    <div className="slot-search h-full flex flex-col" role="group" aria-label="Add course to Top 10">
      <div className="p-3 border-b border-border">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          aria-label="Search courses"
        />
      </div>

      <div 
        ref={resultsRef}
        className="flex-1 overflow-y-auto p-1"
        style={{ maxHeight: '220px' }}
      >
        {loading ? (
          <SkeletonList rows={6} />
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Trouble loading courses</p>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : items?.length ? (
          items.map((course, index) => (
            <ResultRow
              key={course.id}
              course={course}
              onClick={() => handlePickCourse(course)}
              isFocused={index === focusedIndex}
              onMouseEnter={() => setFocusedIndex(index)}
            />
          ))
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {query ? "No matches found" : "Start typing to search courses"}
            </p>
            {!query && !suggestions.length && (
              <p className="text-xs text-muted-foreground">
                Suggestions will appear here
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultRowProps {
  course: Course;
  onClick: () => void;
  isFocused: boolean;
  onMouseEnter: () => void;
}

function ResultRow({ course, onClick, isFocused, onMouseEnter }: ResultRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`p-2 rounded-md cursor-pointer transition-colors ${
        isFocused ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
      }`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-center gap-3">
        {course.thumbnail_image ? (
          <img 
            src={course.thumbnail_image} 
            alt="" 
            className="w-8 h-8 rounded object-cover bg-muted"
          />
        ) : (
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{course.name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <img 
              src={`https://flagicons.lipis.dev/flags/4x3/${getFlagCode(course.country).toLowerCase()}.svg`}
              alt={`${course.country} flag`}
              className="w-4 h-3 rounded-sm object-cover"
            />
            <span className="truncate">{course.region}</span>
            {course.played && (
              <span className="text-primary">• Played</span>
            )}
          </div>
        </div>
        
        {course.rating && (
          <Badge variant="secondary" className="text-xs">
            {course.rating.toFixed(1)}
          </Badge>
        )}
      </div>
    </div>
  );
}

function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
          </div>
          <div className="w-12 h-5 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}