import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchPillProps {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
  placeholder?: string;
}

const SearchPill = ({ 
  className, 
  autoFocus = false, 
  onClose,
  placeholder = "Search..." 
}: SearchPillProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={cn(
      "relative flex items-center w-full",
      className
    )}>
      <Search className="absolute left-4 h-4 w-4 text-muted-foreground z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={cn(
          "w-full h-11 md:h-12 pl-11 pr-4 rounded-full",
          "bg-white/10 backdrop-blur-md border border-hud-border",
          "text-white placeholder:text-white/60",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
          "transition-all duration-200"
        )}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default SearchPill;