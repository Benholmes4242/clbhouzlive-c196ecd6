import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeaderVariant } from '@/contexts/HeaderContext';

interface SearchPillProps {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
  placeholder?: string;
  variant?: HeaderVariant;
}

const SearchPill = ({ 
  className, 
  autoFocus = false, 
  onClose,
  placeholder = "Search...",
  variant = 'glass-dark'
}: SearchPillProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isGlassDark = variant === 'glass-dark';
  const isSolidLight = variant === 'solid-light';

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "relative flex items-center rounded-full transition-all duration-300 ease-out",
          "h-11 md:h-12 px-4 md:px-6 gap-3",
          // Variant-specific styling
          isGlassDark && [
            "bg-white/10 backdrop-blur-md border border-white/20",
            isFocused && "bg-white/15 border-discover-orange/60 ring-2 ring-discover-orange/30 shadow-lg shadow-discover-orange/10"
          ],
          isSolidLight && [
            "bg-gray-100/80 border border-gray-200/60",
            isFocused && "bg-white border-discover-orange/50 ring-2 ring-discover-orange/20 shadow-lg shadow-discover-orange/10"
          ]
        )}
      >
        {/* Search Icon */}
        <Search className={cn(
          "h-4 w-4 md:h-5 md:w-5 flex-shrink-0",
          isGlassDark && "text-white/70",
          isSolidLight && "text-gray-500"
        )} />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-sm md:text-base",
            "placeholder:transition-colors duration-200",
            isGlassDark && [
              "text-white placeholder:text-white/50",
              isFocused && "placeholder:text-white/70"
            ],
            isSolidLight && [
              "text-gray-900 placeholder:text-gray-500",
              isFocused && "placeholder:text-gray-600"
            ]
          )}
        />

        {/* Clear/Close button */}
        {(query || onClose) && (
          <button
            onClick={handleClear}
            className={cn(
              "flex-shrink-0 p-1 rounded-full transition-all duration-300 ease-out focus:outline-none",
              "hover:backdrop-blur-sm hover:shadow-md",
              isGlassDark && "hover:bg-discover-orange/20 hover:border hover:border-discover-orange/30 focus:bg-discover-orange/20",
              isSolidLight && "hover:bg-discover-orange/10 hover:border hover:border-discover-orange/20 focus:bg-discover-orange/10"
            )}
            aria-label="Clear search"
          >
            <X className={cn(
              "h-3 w-3 md:h-4 md:w-4 transition-colors duration-300",
              isGlassDark && "text-white/70 hover:text-discover-orange-light",
              isSolidLight && "text-gray-500 hover:text-discover-orange"
            )} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchPill;