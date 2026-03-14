import React, { useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  resultCount?: number;
  className?: string;
  autoFocus?: boolean;
}

export function AdminSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  isLoading,
  resultCount,
  className,
  autoFocus,
}: AdminSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘F to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-10 pl-9 pr-20 rounded-lg border border-border/60 bg-background',
          'text-[13.5px] text-foreground placeholder:text-muted-foreground',
          'outline-none focus:border-border focus:ring-2 focus:ring-border/20',
          'transition-all duration-150',
        )}
      />

      {/* Right side: loading / count / clear */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {!isLoading && resultCount !== undefined && value && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {resultCount.toLocaleString()}
          </span>
        )}
        {value && (
          <button
            onClick={() => onChange('')}
            className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-90"
            aria-label="Clear search"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
