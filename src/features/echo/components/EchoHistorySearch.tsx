/**
 * Echo History Search Bar with Filter Pills
 * Apple-style search + frosted filter chips
 */

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export type FilterType = 'all' | 'has_response' | 'no_response' | 'last_7_days' | 'last_30_days';

interface EchoHistorySearchProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: {
    hasResponse?: boolean;
    dateFrom?: Date;
  }) => void;
  className?: string;
}

export const EchoHistorySearch: React.FC<EchoHistorySearchProps> = ({
  onSearchChange,
  onFilterChange,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const debouncedQuery = useDebounce(query, 200);

  // Propagate debounced search query
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  // Handle filter changes
  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    
    const now = new Date();
    const filters: { hasResponse?: boolean; dateFrom?: Date } = {};

    switch (filter) {
      case 'has_response':
        filters.hasResponse = true;
        break;
      case 'no_response':
        filters.hasResponse = false;
        break;
      case 'last_7_days':
        filters.dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        filters.dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        // 'all' - no filters
        break;
    }

    onFilterChange(filters);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" to focus search
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('echo-search-input')?.focus();
      }
      // Escape to clear
      if (e.key === 'Escape' && document.activeElement?.id === 'echo-search-input') {
        setQuery('');
        setActiveFilter('all');
        onFilterChange({});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFilterChange]);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'has_response', label: 'Has response' },
    { id: 'no_response', label: 'No response' },
    { id: 'last_7_days', label: 'Last 7 days' },
    { id: 'last_30_days', label: 'Last 30 days' },
  ];

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative mb-3">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--hub-text-dim)' }}
        />
        <input
          id="echo-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full h-10 pl-10 pr-10 rounded-[14px] text-[15px] transition-colors"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--hub-text)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
          aria-label="Search conversations"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setActiveFilter('all');
              onFilterChange({});
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
            style={{ color: 'var(--hub-text-dim)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
              style={{
                background: isActive
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'
                }`,
                color: isActive ? 'var(--hub-text)' : 'var(--hub-text-dim)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              aria-pressed={isActive}
              aria-label={`Filter by ${filter.label}`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
