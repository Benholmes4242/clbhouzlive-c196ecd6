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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#94A3B8' }} />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-20 text-[13.5px] outline-none transition-all duration-150"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          color: '#334155',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = '#F5A623';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.1)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#94A3B8' }} />
        )}
        {!isLoading && resultCount !== undefined && value && (
          <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>
            {resultCount.toLocaleString()}
          </span>
        )}
        {value && (
          <button
            onClick={() => onChange('')}
            className="h-5 w-5 rounded-full flex items-center justify-center transition-colors active:scale-90"
            style={{ background: '#F1F5F9' }}
            aria-label="Clear search"
          >
            <X className="w-3 h-3" style={{ color: '#94A3B8' }} />
          </button>
        )}
      </div>
    </div>
  );
}
